import 'dotenv/config'

const LLM_MODELNAME = process.env.LLM_MODELNAME ?? "gpt-4o-mini";
const LLM_API_ENDPOINT = process.env.LLM_API_ENDPOINT ?? "https://api.openai.com/v1/responses";
const LLM_API_TOKEN = process.env.LLM_API_TOKEN

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
You are the arbiter for the “what beats this thing” game.
requirements:
- You will be given a user_guess, e.g., "paper".
- You will be given a current_subject, e.g., "rock".
- set user_guess to a normalized, singular version of the user_guess.
- Consider common-sense physics, logic, human culture, or widely known facts.
- Be consistent: If A beats B because of property P, the same logic could apply later.
- If the guess is too abstract or nonsense, say it does not beat.
- Reject amount of the thing guesses for example 2 apple beats an apple
- If beats=true, set next_subject to a normalized, singular version of user_guess.- If beats=false, keep next_subject equal to current_subject.
- Never invent extra fields. No narration.
- Keep \"reason\" to one short sentence.
- Make sure the beat value correlate with the reason
- Output ONLY valid JSON that matches the provided JSON schema.
JSON schema:
{
    "beats": boolean,
    "user_guess": string,
    "reason": string,
    "next_subject": string
}`
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
                                    "next_subject": {
                                        "type": "string",
                                        "description": "The next subject, per the rules."
                                    }
                                },
                                "required": [
                                    "user_guess",
                                    "beats",
                                    "reason",
                                    "next_subject"
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
