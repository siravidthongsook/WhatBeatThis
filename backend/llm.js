import 'dotenv/config';

const LLM_MODELNAME = process.env.LLM_MODELNAME ?? "gpt-4o-mini";
const LLM_API_ENDPOINT = process.env.LLM_API_ENDPOINT ?? "https://api.openai.com/v1/responses";
const LLM_API_TOKEN = process.env.LLM_API_TOKEN;

if (!process.env.LLM_MODELNAME) {
    console.warn("WARNING: LLM_MODELNAME not found inside .env, using default gpt-4o-mini");
}
else {
    console.log("Using LLM_MODELNAME:", LLM_MODELNAME);
}

if (!LLM_MODELNAME) {
    throw new Error("LLM_MODELNAME not found or incorrect. Please provide a correct LLM_MODELNAME inside .env")
}

export default class LLMUtils {
    static async validateUserGuess(userGuess, currentSubject, history) {
        if (!userGuess || typeof userGuess !== "string") {
            throw new Error("ERROR: LLMUtils.validateUserGuess function requires userGuess string parameter");
        }
        if (!currentSubject || typeof currentSubject !== "string") {
            throw new Error("ERROR: LLMUtils.validateUserGuess function requires currentSubject string parameter");
        }
        // history is optional but if provided, must be this schema
        // [
        //     { role: "user"|"assistant", content: [ { type: "input_text"|"message", text: string } ] },
        //     ...
        // ]
        if (history !== undefined) {
            if (!Array.isArray(history)) {
            throw new Error("ERROR: LLMUtils.validateUserGuess function requires history to be an array if provided");
            }
            for (const entry of history) {
                if (
                    !entry ||
                    (entry.role !== "user" && entry.role !== "assistant") ||
                    !Array.isArray(entry.content) ||
                    entry.content.some(
                    c =>
                        !c ||
                        (c.type !== "input_text" && c.type !== "output_text") ||
                        typeof c.text !== "string"
                    )
                ) 
                {
                    throw new Error("ERROR: LLMUtils.validateUserGuess function requires history entries to match the strict schema");
                }
            }
        }


        const system = `
You are the arbiter for the "What Beats/Win This Thing" game.  
Follow these rules strictly:

INPUTS:
- current_subject: e.g. "rock"
- user_guess: e.g. "paper", "water", "นำ้"

REQUIREMENTS:
1. Normalize user_guess:
   - Convert to English if given in another language.
   - Use lowercase, singular form in English.
   - If user_guess == current_subject → beats=false; reason="They are the same thing."

2. Definition of "beats":
   - user_guess defeats, damages, overcomes, or is widely known to win against current_subject.
   - Reject quantity-based guesses ("many X", "two X") → beats=false.

3. Decision:
   - If user_guess beats current_subject → beats=true.
   - If not → beats=false.
   - Only evaluate user_guess → current_subject (not the reverse).

4. Reason:
   - Must be one short, direct sentence.
   - Must align with beats value (no contradictions).
   - If nonsense guess → beats=false with valid reason.

5. Special Cases (apply ONLY if both current_subject AND user_guess exactly match one of these pairs):
   - { "current_subject": "computer", "user_guess": "programmer", "beats": false, "reason": "They create many bugs." }
   - { "current_subject": "computer", "user_guess": "rock", "beats": false, "reason": "That's the other game haha" }
   - { "current_subject": "computer", "user_guess": "paper", "beats": false, "reason": "That's the other game haha" }
   - { "current_subject": "computer", "user_guess": "scissors", "beats": false, "reason": "That's the other game haha" }
   - { "current_subject": "husband", "user_guess": "wife", "beats": true, "reason": "Because she is always right" }
   - { "current_subject": "computer", "user_guess": "mom", "beats": true, "reason": "Because she can stop you from playing games and make you do my homework" }

6. Output:
   - Always return valid JSON with this schema:
     {
       "user_guess": string,   // normalized English
       "beats": boolean,
       "reason": string,
       "user_guess_emoji": string,        // best emoji for user_guess noun, ❓ if none
       "is_repeat_guess": boolean
     }
   - No extra fields. No narration. JSON only.

KNOWLEDGE EXAMPLES:
- water beats computer → "Water damages computer."
- fire beats computer → "Fire damages computer."
- air does not beat fire → "Air fuels fire."
- rock beats scissors → "Rock breaks scissors."
- fire beats ice → "Fire melts ice."
- light beats ice → "Light melts ice."
- water beats rock → "Water erodes rock."
`
        const userprompt = { "role": "user",
            "content": [
                    {
                "type": "input_text",
                "text": `current_subject: ${currentSubject}, user_guess: ${userGuess}`
            }
        ]}

        const response = await fetch(LLM_API_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${LLM_API_TOKEN}`
            },
            body: JSON.stringify(
                {
                    "model": LLM_MODELNAME,
                    "input": [
                        {
                            "role": "system",
                            "content": [
                                {
                                    "type": "input_text",
                                    "text": system
                                }
                            ]
                        },
                        ...history,
                        userprompt

                    ],
                    "text": {
                        "format": {
                            "type": "json_schema",
                            "name": "whatbeatsthis",
                            "strict": true,
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "user_guess": {
                                        "type": "string",
                                        "description": "The user’s guess for what might beat the current subject."
                                    },
                                    "beats": {
                                        "type": "boolean",
                                        "description": "Whether the user_guess beats the current_subject."
                                    },
                                    "reason": {
                                        "type": "string",
                                        "description": "Short justification for the outcome."
                                    },
                                    "user_guess_emoji": {
                                        "type": "string",
                                        "description": "An emoji that represents the user_guess, e.g., 🪨 for rock, 📄 for paper, ✂️ for scissors."
                                    },
                                    "is_repeat_guess": {
                                        "type": "boolean",
                                        "description": "Whether the user_guess has already been used in this game."
                                    }
                                },
                                "required": [
                                    "user_guess",
                                    "beats",
                                    "reason",
                                    "user_guess_emoji",
                                    "is_repeat_guess"
                                ],
                                "additionalProperties": false
                            }
                        },
                        "verbosity": "medium"
                    },
                    // Note: 'reasoning' and 'include' are only supported on
                    // specific reasoning/search models (e.g., o3 family).
                    // Remove them for gpt-4o-mini compatibility.
                    "tools": [],
                    // "store": true
                }

            )
        })

        // raw llm api response
        let jsonData;
        try {
            jsonData = await response.json()
        }
        catch {
            throw new Error("ERROR: LLMUtils.validateUserGuess function cannot parse JSON with response")
        }
        
        if (!jsonData) {
            throw new Error("ERROR: LLMUtils.validateUserGuess function got no response")
        }
        if (jsonData.error) {
            throw new Error("ERROR: LLMUtils.validateUserGuess function got error from LLM API - " + JSON.stringify(jsonData.error))
        }

        const messageObj = LLMUtils.getMessageObj(jsonData)
        if (!messageObj) {
            throw new Error("ERROR: LLMUtils.validateUserGuess function cannot find message object in response")
        }

        try {
            JSON.parse(messageObj.content[0].text)
        }
        catch {
            throw new Error("ERROR: LLMUtils.validateUserGuess function cannot parse JSON with messageObj content")
        }
        const content = JSON.parse(messageObj.content[0].text)

        return content
    }

    static getMessageObj(rawResponse) {
        if (!rawResponse || !rawResponse.output) {
            throw new Error("ERROR: LLMUtils.getMessageObf -> Invalid response format");
        }
        const messageObj = rawResponse.output.find(msg => msg.type === "message");
        if (!messageObj) {
            return null
        }
        return messageObj
    }

    static getHistoryEntry(current_subject, user_guess, llm_response) {
        return [
            { 
                "role": "user",
                "content": [
                        {
                    "type": "input_text",
                    "text": `current_subject: ${current_subject}, user_guess: ${user_guess}`
                }]
            },
            {
                "role": "assistant",
                "content": [
                    {
                        "type": "output_text",
                        "text": JSON.stringify(llm_response)
                    }
                ]
            }
        ]
    }
}
