import { NextRequest, NextResponse } from "next/server";
import {
  startConversation,
  sendMessage,
  getActivities,
  generateToken,
} from "@/lib/direct-line";

/**
 * POST /api/chat
 * Actions: "start" | "send" | "poll" | "token"
 *
 * - start:  Begin a new Direct Line conversation
 * - send:   Send a user message to the conversation
 * - poll:   Retrieve new bot activities (with watermark)
 * - token:  Generate a short-lived Direct Line token
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "start": {
        const conversation = await startConversation();
        return NextResponse.json(conversation);
      }

      case "send": {
        const { conversationId, token, text, userId } = body;
        if (!conversationId || !token || !text) {
          return NextResponse.json(
            { error: "Missing conversationId, token, or text" },
            { status: 400 }
          );
        }
        const activityId = await sendMessage(
          conversationId,
          token,
          text,
          userId
        );
        return NextResponse.json({ activityId });
      }

      case "poll": {
        const { conversationId, token, watermark } = body;
        if (!conversationId || !token) {
          return NextResponse.json(
            { error: "Missing conversationId or token" },
            { status: 400 }
          );
        }
        const activities = await getActivities(
          conversationId,
          token,
          watermark
        );
        return NextResponse.json(activities);
      }

      case "token": {
        const tokenData = await generateToken();
        return NextResponse.json(tokenData);
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    console.error("[/api/chat] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
