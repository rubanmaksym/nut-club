export async function GET() {
  try {
    const url =
      "https://script.google.com/macros/s/AKfycbw1crASkJZbnNCA0rAz0fs4G8r6vYtOA0JE6jmIhdFl_ZfevqaxbIWeMfu4m_4G8dWH/exec?mode=catalog"
    const res = await fetch(url, {
      cache: "no-store",
      redirect: "follow",
    });

    const text = await res.text();

    // Попробуем распарсить как JSON
    try {
      const data = JSON.parse(text);
      return Response.json(data);
    } catch {
      // Если пришёл не JSON, вернём кусок ответа для диагностики
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
        error: "catalog_fetch_failed",
        message: String(error),
      },
      { status: 500 }
    );
  }
}