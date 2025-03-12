document.getElementById("upload").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (file && file.name.endsWith(".docx")) {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const arrayBuffer = e.target.result;

      // שימוש ב-Mammoth.js להמרת DOCX לטקסט
      mammoth.extractRawText({ arrayBuffer: arrayBuffer })
        .then((result) => {
          const output = document.getElementById("output");
          let text = result.value;
          
          text = text
          .split("\n") // פיצול הטקסט לשורות
          .map((line) => line.trim()) // הסרת רווחים בתחילת ובסוף כל שורה
          .filter((line) => line !== "") // הסרת שורות ריקות
          .join("\n"); // חיבור מחדש של השורות

          // בדיקה אם הטקסט כולל עברית, ואם כן, שינוי כיווניות ל-RTL
          if (/[\u0590-\u05FF]/.test(text)) {
            output.style.direction = "rtl";
          } else {
            output.style.direction = "ltr";
          }

          output.value = text; // הצגת הטקסט בתיבת הטקסט
        })
        .catch((err) => {
          console.error("Error parsing DOCX:", err);
          alert("שגיאה בקריאת הקובץ. נסה שוב.");
        });
    };

    reader.readAsArrayBuffer(file);
  } else {
    alert("נא להעלות קובץ Word תקין בפורמט .docx.");
  }
});
async function sendToGPTForSummary() {
  const text = document.getElementById("output").value;

  if (!text) {
    alert("תיבת הטקסט ריקה. נא להעלות קובץ קודם.");
    return;
  }

  const apiKey = "ENTER_YOUR_API_KEY"
  try {
    loadingText.style.display = "block";
const response = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`, // הכנסי את מפתח ה-API שלך כאן
  },
  body: JSON.stringify({
    model: "gpt-4", // או gpt-4-turbo בהתאם לצורך
    messages: [
      { role: "system", content: "אתה עוזר מועיל ושירותי. ענה בעברית בלבד" },
      { role: "user", content: `תתמצת את הפסיקה ב4 שורות ,על מה מדובר:\n\n${text}` },
    ],
    max_tokens: 200,
    temperature: 0.7,
  }),
});

    
    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    const gptSummary = data.choices[0].message.content.trim();

    // הצגת הסיכום בתיבת הטקסט
    document.getElementById("summary").value = gptSummary;
  } catch (error) {
    console.error("Error communicating with OpenAI:", error);
    alert("שגיאה בתקשורת עם OpenAI. בדוק את המפתח או נסה שוב.");
  }
}
document.getElementById("copy-summary").addEventListener("click", () => {
  const summaryText = document.getElementById("summary").value;
  if (!summaryText) {
    alert("אין סיכום להעתקה.");
    return;
  }
  
  navigator.clipboard.writeText(summaryText)
    .then(() => {
      alert("הסיכום הועתק בהצלחה!");
    })
    .catch((err) => {
      console.error("שגיאה בהעתקה:", err);
      alert("שגיאה בהעתקת הסיכום.");
    });
});

document.getElementById("summarize").addEventListener("click", sendToGPTForSummary);

