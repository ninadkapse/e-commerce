# Copilot Studio Setup Guide — Contoso E-Commerce Auto-Pilot

This guide walks you through configuring Microsoft Copilot Studio to power the multi-agent routing for the Contoso E-Commerce Admin dashboard.

---

## 1. Create the Bot

1. Navigate to [Copilot Studio](https://copilotstudio.microsoft.com)
2. Click **Create** → **New copilot**
3. Name it **Contoso E-Commerce Assistant**
4. Set the description: *"Multi-agent assistant for e-commerce support and operations"*
5. Choose your environment and language (English)
6. Click **Create**

---

## 2. Define Topics

You need three topics: a **Router**, a **Support Agent** topic, and an **Ops Agent** topic.

### 2a. Router Topic (System Fallback)

Configure the **Fallback** system topic to act as the router:

- **Trigger**: Anything not matched by other topics
- **Message**:
  ```
  Hello! I'm the Contoso E-Commerce assistant. I can help you with:

  🛟 **Support** — Refunds, complaints, discount codes
  📦 **Operations** — Shipping status, inventory, replacements

  How can I assist you today?
  ```
- **Channel Data** (Advanced → Set variable):
  - `topic.activeAgent` = `"router"`

### 2b. Support Agent Topic

- **Name**: `Support Agent`
- **Trigger phrases**:
  - "I want a refund"
  - "I'm angry about my order"
  - "This is terrible service"
  - "I need a discount"
  - "I want to complain"
  - "Worst experience ever"
  - "I'm frustrated"
  - "Cancel my order"
- **Flow**:
  1. **Set variable**: `topic.activeAgent` = `"support"`
  2. **Ask a question**: "I'm sorry to hear that. Could you provide your order ID?" → Save to `topic.orderId`
  3. **Call Power Automate flow**: `FetchOrder` (input: `topic.orderId`)
  4. **Call Power Automate flow**: `ApplyDiscount` (input: `topic.orderId`, percentage: `20`)
  5. **Message**:
     ```
     I sincerely apologize for the inconvenience. As a gesture of goodwill,
     I've generated a 20% discount code for your next purchase: {discountCode}

     Please use this code at checkout. Is there anything else I can help with?
     ```
  6. **End conversation** with survey

### 2c. Ops Agent Topic

- **Name**: `Ops Agent`
- **Trigger phrases**:
  - "Where is my order?"
  - "Shipping status"
  - "When will my order arrive?"
  - "I need a replacement"
  - "My order is lost"
  - "My order is damaged"
  - "Check stock"
  - "Inventory check"
  - "Track my package"
  - "Delivery update"
- **Flow**:
  1. **Set variable**: `topic.activeAgent` = `"ops"`
  2. **Ask a question**: "I'd be happy to help with your order. What is your order ID?" → Save to `topic.orderId`
  3. **Call Power Automate flow**: `FetchOrder` (input: `topic.orderId`)
  4. **Condition**: Check if user mentioned "replace", "lost", or "damaged"
     - **Yes branch**:
       1. **Call Power Automate flow**: `CheckStock` (input: product name from order)
       2. **Call Power Automate flow**: `TriggerReplacement` (input: `topic.orderId`)
       3. **Message**: "I've checked our stock and initiated a replacement. Your new tracking number is: {trackingNumber}"
     - **No branch**:
       1. **Call Power Automate flow**: `CheckStock` (input: product name from order)
       2. **Message**: "Your order {orderId} is currently '{status}'. Tracking: {trackingNumber}. Stock: {stockMessage}"
  5. **End conversation** with survey

---

## 3. Power Automate Flows

Create these flows in [Power Automate](https://make.powerautomate.com) and connect them to Copilot Studio.

### 3a. FetchOrder Flow

- **Trigger**: Copilot Studio (When a flow is called from a copilot)
- **Input**: `orderId` (String)
- **Actions**:
  - Query your data source (Azure SQL / Dynamics 365 / Dataverse)
  - Return: `customerName`, `product`, `status`, `trackingNumber`, `total`
- **Output**: Return values to Copilot Studio

### 3b. CheckStock Flow

- **Trigger**: Copilot Studio
- **Input**: `productName` (String)
- **Actions**:
  - Query inventory table
  - Return: `stockCount`, `isInStock` (Boolean)
- **Output**: Return values to Copilot Studio

### 3c. ApplyDiscount Flow

- **Trigger**: Copilot Studio
- **Input**: `orderId` (String), `percentage` (Number)
- **Actions**:
  - Generate discount code (e.g., `CONTOSO20-{random}`)
  - Store in discounts table
  - Return: `discountCode`
- **Output**: Return `discountCode` to Copilot Studio

### 3d. TriggerReplacement Flow

- **Trigger**: Copilot Studio
- **Input**: `orderId` (String)
- **Actions**:
  - Create replacement order record
  - Generate new tracking number
  - Update original order status to "replacement_sent"
  - Return: `newTrackingNumber`
- **Output**: Return `newTrackingNumber` to Copilot Studio

---

## 4. Publish to Direct Line Channel

1. In Copilot Studio, go to **Settings** → **Channels**
2. Click **Direct Line** (or **Custom website**)
3. Copy the **Direct Line Secret** — this is your `DIRECT_LINE_SECRET` env var
4. Copy the **Bot ID** — this is your `BOT_ID` env var

---

## 5. Environment Variable Mapping

Set these in your `.env.local` file (for local dev) or Azure App Service settings:

| Variable              | Source                           | Description                       |
|-----------------------|----------------------------------|-----------------------------------|
| `DIRECT_LINE_SECRET`  | Copilot Studio → Channels → DL   | Secret for authenticating with Direct Line API |
| `BOT_ID`              | Copilot Studio → Settings         | Bot's unique identifier           |
| `DIRECT_LINE_BASE_URL`| Default value works              | `https://directline.botframework.com` |

---

## 6. Channel Data for Agent Badge

To send agent metadata to the ChatSidebar, use **Send a message** with channel data in each topic:

In the **Advanced** settings of each message node, add channel data JSON:

```json
{
  "activeAgent": "support"
}
```

or

```json
{
  "activeAgent": "ops"
}
```

The ChatSidebar component reads `activity.channelData.activeAgent` to display the correct agent badge.

---

## 7. Testing

1. Use the **Test** pane in Copilot Studio to verify topic routing
2. Run the Next.js app locally: `npm run dev`
3. Open the chat sidebar and send messages
4. Without Direct Line configured, the app falls back to the local mock agent
5. With Direct Line configured, messages route through Copilot Studio

---

## Architecture Flow

```
User types in ChatSidebar
        ↓
Next.js /api/chat (proxy)
        ↓
Direct Line API → Copilot Studio Bot
        ↓
Router detects intent → Support or Ops topic
        ↓
Topic calls Power Automate flows
        ↓
Response sent back via Direct Line
        ↓
ChatSidebar displays response + agent badge
```
