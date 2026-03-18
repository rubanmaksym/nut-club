export async function POST(req: Request) {
  try {
    const body = await req.text();

    const res = await fetch(
      "https://script.google.com/macros/s/AKfycbw1crASkJZbnNCA0rAz0fs4G8r6vYtOA0JE6jmIhdFl_ZfevqaxbIWeMfu4m_4G8dWH/exec?mode=catalog",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
        redirect: "follow",
        cache: "no-store",
      }
    );

    const text = await res.text();

    try {
      const data = JSON.parse(text);
      return Response.json(data);
    } catch {
      return Response.json(
        {
          error: "not_json_from_google",
          status: res.status,
          preview: text.slice(0, 500),
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return Response.json(
      {
        error: "order_fetch_failed",
        message: String(error),
      },
      { status: 500 }
    );
  }
}