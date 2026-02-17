# Copilot Studio Setup Guide — Contoso E-Commerce Auto-Pilot

This guide covers the full AI Agent setup for the Contoso E-Commerce portal, including Copilot Studio bot configuration, Power Automate agent flows, and MS Teams integration.

---

## Architecture Overview

```
Customer → ChatSidebar → Direct Line → Copilot Studio Agent
                                            │
                     ┌──────────────────────┼──────────────────────┐
                     ▼                      ▼                      ▼
              Order Tracking         Complaint/Refund        Product Inquiry
              Agent Topic            Agent Topic             Agent Topic
                     │                      │                      │
                     ▼                      ▼                      ▼
              FetchOrder Flow        ApplyDiscount Flow     FetchProducts Flow
              (HTTP → API)           (HTTP → API)           (HTTP → API)
                     │                      │
                     ▼                      ▼
              CheckStock Flow        Replacement Topic
              (HTTP → API)                  │
                     │                      ▼
                ┌────▼────┐          TriggerReplacement Flow
                │ Stock   │          (HTTP → API)
                │ < 5?    │
                └────┬────┘
                     ▼
              SendTeamsAlert Flow
              (→ hadarc@...)
```

---

## 1. Bot Details

| Field | Value |
|-------|-------|
| **Name** | Contoso E-Commerce Assistant |
| **Bot ID** | `2e0fe539-000f-48dc-b346-24cd6d6e8de4` |
| **Schema** | `contoso_ecommerce_assistant` |
| **Environment** | Default (Contoso) |
| **Dataverse URL** | `https://orgda6d5453.crm.dynamics.com` |
| **Channels** | Direct Line, Microsoft Teams |
| **Generative Actions** | Enabled |

---

## 2. Agent Topics (12 total)

### Core Agent Topics

| Topic | Schema | Description | Flows Called |
|-------|--------|-------------|-------------|
| **Support Agent** | `SupportAgent` | Handles complaints, refunds, angry customers. Validates customer → fetches order → applies 20% discount | FetchOrder, ApplyDiscount |
| **Ops Agent** | `OpsAgent` | Handles shipping, tracking, replacements. Checks stock before replacement → alerts if low | FetchOrder, CheckStock, TriggerReplacement, LowStockAlert |
| **Product Inquiry** | `ProductInquiry` | Answers product questions, pricing, availability | FetchProducts |

### System Topics

| Topic | Description |
|-------|-------------|
| **Conversation Start** | Welcome message with 4-capability menu |
| **Greeting** | Responds to "Hi", "Hello" with capability menu |
| **Fallback** | Retry with capability hints (3 retries then escalate) |
| **Escalate** | Provides support@contoso.com and 1-800-CONTOSO |
| **End of Conversation** | Satisfaction survey |
| **Goodbye** | Farewell message |
| **Thank You** | Acknowledgment |
| **On Error** | Error handling |
| **Multiple Topics Matched** | Disambiguation |

---

## 3. Power Automate Agent Flows (7 total)

All flows use HTTP connectors to call the Azure App Service API at `https://contoso-ecommerce-app.azurewebsites.net`.

| Flow | ID | Trigger | API Endpoint |
|------|----|---------|-------------|
| **Contoso - FetchOrder** | `fccceb51-33a9-5cdf-22e9-9efbfe85327f` | Button (OrderId) | `GET /api/orders/{orderId}` |
| **Contoso - CheckStock** | `21714168-c5a7-25eb-0779-af0bd06ed6f1` | Button (SKU) | `POST /api/simulate` `{action:"check-stock",sku}` |
| **Contoso - ApplyDiscount** | `74317be4-52f3-deef-cbdb-32515354bf39` | Button (OrderId) | `POST /api/simulate` `{action:"apply-discount",orderId,percentage:20}` |
| **Contoso - TriggerReplacement** | `8520237b-3f1f-ce2f-fc92-b6c0d058c25c` | Button (OrderId) | `POST /api/simulate` `{action:"trigger-replacement",orderId}` |
| **Contoso - FetchProducts** | `ca3e11f0-0882-85cf-e25f-e83078988564` | Button (Category) | `GET /api/products` |
| **Contoso - LowStockAlert** | `eec6e600-eafd-2b59-19f7-9960f15692f7` | Button (AlertMessage) | `POST /api/simulate` `{action:"low-stock-alert",threshold:5}` |
| **Contoso - SendTeamsAlert** | `ee71fa1a-3ad6-11ea-9c92-f436098382f3` | Button (Title, Body) | Compose → Teams message |

### Converting Flows to Copilot Studio Agent Flows

To use these flows as tools in Copilot Studio topics:

1. Open [Power Automate](https://make.powerautomate.com)
2. Navigate to **Solutions** → find each flow
3. Edit the flow → Change trigger from **Button** to **Run a flow from Copilot**
4. Save the flow
5. In Copilot Studio, go to the topic → **Add node** → **Call an action** → select the flow

---

## 4. Add MS Teams Connector to SendTeamsAlert Flow

The SendTeamsAlert flow needs a Teams connector for sending inventory alerts:

1. Open [Power Automate](https://make.powerautomate.com)
2. Find **Contoso - SendTeamsAlert** flow
3. Edit the flow
4. Between **Compose_Alert** and **Respond**, add a new action:
   - Search for **Microsoft Teams**
   - Select **Post message in a chat or channel**
   - **Post as**: Flow bot
   - **Post in**: Chat with Flow bot
   - **Recipient**: `hadarc@m365cpi63151788.onmicrosoft.com`
   - **Message**: Use dynamic content from trigger inputs (AlertTitle + AlertBody)
5. Authorize the Teams connection when prompted
6. Save the flow

---

## 5. Enable MS Teams Channel

The bot is configured with Teams channel enabled. To deploy to Teams:

1. Open [Copilot Studio](https://copilotstudio.microsoft.com)
2. Select **Contoso E-Commerce Assistant**
3. Go to **Channels** → **Microsoft Teams**
4. Click **Turn on Teams**
5. Click **Open bot** to test in Teams

---

## 6. API Endpoints Reference

Base URL: `https://contoso-ecommerce-app.azurewebsites.net`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products` | Get all products with stock levels |
| `GET` | `/api/orders` | Get all orders (optional `?email=` filter) |
| `GET` | `/api/orders/{id}` | Get single order with tracking events |
| `GET` | `/api/orders/{id}/track` | Get delivery tracking timeline |
| `POST` | `/api/orders` | Place new order `{customerName, email, items}` |
| `GET` | `/api/simulate` | Health check — lists available actions |
| `POST` | `/api/simulate` | Agent actions (see below) |

### Simulate Actions

| Action | Body | Description |
|--------|------|-------------|
| `advance` | `{action, orderId}` | Advance order to next delivery stage |
| `advance-all` | `{action}` | Advance all pending orders |
| `apply-discount` | `{action, orderId, percentage}` | Generate discount code |
| `trigger-replacement` | `{action, orderId}` | Create replacement order |
| `check-stock` | `{action, sku}` | Check stock for product |
| `low-stock-alert` | `{action, threshold}` | Get low stock products |

---

## 7. Environment Variables

Set in Azure App Service → **Configuration** → **Application settings**:

| Variable | Description |
|----------|-------------|
| `COPILOT_TOKEN_ENDPOINT` | Copilot Studio regional token endpoint |
| `BOT_ID` | `2e0fe539-000f-48dc-b346-24cd6d6e8de4` |
| `PORT` | `3000` |

---

## 8. Testing Walkthrough

### Scenario 1: Order Tracking
1. Open chat → Say "Where is my order?"
2. Agent asks for name and order ID
3. Enter `ORD-1001` → Agent calls FetchOrder flow → Shows status

### Scenario 2: Complaint & Refund
1. Say "I'm angry about my order"
2. Support Agent connects → asks for name, email, order ID
3. Agent fetches order, empathizes → generates 20% discount code

### Scenario 3: Replacement
1. Say "My order is damaged, I need a replacement"
2. Ops Agent → asks for order ID
3. Checks stock → triggers replacement → new tracking number
4. If stock < 5, sends Teams alert to inventory manager

### Scenario 4: Product Inquiry
1. Say "What products do you have?"
2. Product Advisor → calls FetchProducts → lists catalog with prices

---

## 9. Deployment

### GitHub Actions CI/CD
The repo includes `.github/workflows/azure-deploy.yml` for automated deployment.

### Manual Deployment
```bash
npm run build
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
cd .next/standalone && zip -r ../../deploy.zip .
az webapp deploy --resource-group contoso-ecommerce-rg --name contoso-ecommerce-app --src-path deploy.zip --type zip
```

 
