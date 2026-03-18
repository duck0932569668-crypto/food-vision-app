import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `請分析圖片中的食物。
請使用繁體中文，並回傳「嚴格的 JSON 格式」，不需要任何 Markdown 標記，格式如下：
{
  "foods": [
    {
      "name": "食物名稱",
      "quantity": 1,
      "calories": 150,
      "boundingBox": [ymin, xmin, ymax, xmax] // 範圍 0 到 1000 的相對座標
    }
  ],
  "totalCalories": 150
}
請盡可能辨識出照片中所有食物，並估算合理的卡路里。如果沒有偵測到食物，請將 foods 設為空陣列。`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text);
    return NextResponse.json(result);
  } catch (error) {
    console.error('AI Analysis Error:', error);
    return NextResponse.json({ error: 'AI Analysis Failed' }, { status: 500 });
  }
}
