const { Configuration, OpenAIApi } = require("openai");

exports.handler = async function(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);
    const { text } = JSON.parse(event.body);

    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: `You are a professional editor who specializes in concise, friendly-professional communication. Format the input text into an email:
        1. Start with "Subject: " followed by a brief, clear subject line
        2. Add TWO line breaks after the subject line
        3. Keep the message concise and conversational yet professional
        4. Remove any unnecessary formalities or redundant phrases
        5. Maintain the core message and intent`
      }, {
        role: "user",
        content: text
      }],
      temperature: 0.7
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: response.data.choices[0].message.content
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to process text" }),
    };
  }
}; 