# 💸 SplitWize

אפליקציית חלוקת הוצאות בזמן אמת לטיול קבוצתי (7 חברים) — עם סגירת חשבון
חכמה (מינימום העברות), סטטיסטיקות, וסנכרון חי בין כל המכשירים.

> Real-time group expense splitter built with React + Vite, Tailwind CSS,
> Supabase (Postgres + Realtime), and deployed on Vercel.

## ✨ תכונות

- **הוספת הוצאה** — מי שילם, סכום, מזומן/אשראי, תיאור, ובחירת מי מתחלק (עם "בחר הכל").
- **פיד חי** — כל ההוצאות, חדשות למעלה, צבע לכל משלם, מחיקה עם אישור. עדכון מיידי בכל הטאבים/המכשירים.
- **סגירת חשבון** — אלגוריתם מינימום העברות (greedy), מאזן אישי, והפרדה בין מזומן לאשראי.
- **סטטיסטיקה** — סך הוצאות, פילוח לפי משלם (גרף עוגה), ההוצאה הגדולה, מי שילם הכי הרבה/מעט.
- **שיתוף ל-WhatsApp** — כפתור שמייצר סיכום מוכן להדבקה בקבוצה.
- **עברית מלאה + RTL**, עיצוב כהה, מובייל-first.

## 🚀 הרצה מקומית

```bash
npm install
npm run dev
```

האפליקציה תרוץ על `http://localhost:5173`.

> **בלי Supabase זה עדיין עובד:** אם לא הגדרתם משתני סביבה, הנתונים נשמרים
> מקומית בדפדפן (`localStorage`) ומסונכרנים בין טאבים. מצוין לבדיקה מהירה,
> אבל לא מסתנכרן בין מכשירים שונים — לשם כך הגדירו Supabase.

## 🗄️ הגדרת Supabase

1. צרו פרויקט חינמי ב-[supabase.com](https://supabase.com).
2. ב-**SQL Editor** הריצו:

```sql
create table expenses (
  id uuid primary key default gen_random_uuid(),
  paid_by text not null,
  amount numeric(10,2) not null,
  description text,
  payment_method text default 'cash',   -- 'cash' | 'credit'
  split_between text[] not null,
  created_at timestamptz default now()
);

-- הפעלת Realtime
alter publication supabase_realtime add table expenses;

-- אין צורך בהתחברות — לינק משותף אחד לכולם.
-- מאפשרים גישה אנונימית מלאה לטבלה:
alter table expenses enable row level security;
create policy "public access" on expenses
  for all using (true) with check (true);
```

3. העתיקו את הערכים מ-**Project Settings → API** לקובץ `.env.local`:

```bash
cp .env.local.example .env.local
```

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

4. הריצו מחדש את `npm run dev`. הבאדג' בכותרת ישתנה ל"מחובר · חי".

## ☁️ פריסה ל-Vercel

```bash
npm i -g vercel
vercel            # פריסת preview
vercel --prod     # פריסה לפרודקשן (לינק לשיתוף)
```

הוסיפו את שני משתני הסביבה ב-Vercel:
**Project → Settings → Environment Variables** → `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`. אז `vercel --prod` שוב.

את הלינק שתקבלו — שלחו לכל החבר'ה. 🎉

## 🧮 לוגיקת החישוב

`src/lib/settlements.js` מייצא פונקציה טהורה וניתנת לבדיקה:

```js
import { calculateSettlements } from './lib/settlements'
const result = calculateSettlements(expenses, { people: PEOPLE_NAMES })
// → { total, perPerson, transfers, byMethod }
```

האלגוריתם: חישוב מאזן נטו לכל אדם, ואז greedy — התאמת הנושה הגדול לחייב
הגדול עד לאיזון. החישוב נעשה ב"אגורות" (מספרים שלמים) כדי להימנע משגיאות
עיגול. הרצת הבדיקות:

```bash
npm test
```

## 📁 מבנה הפרויקט

```
src/
  components/
    AddExpenseForm.jsx   טופס הוספת הוצאה
    ExpenseFeed.jsx      פיד חי
    SettlementView.jsx   סגירת חשבון + שיתוף WhatsApp
    StatsPanel.jsx       סטטיסטיקות וגרפים
    PersonAvatar.jsx     אווטאר צבעוני לפי אדם
  lib/
    supabase.js          לקוח Supabase + שכבת נתונים (עם fallback מקומי)
    settlements.js       מינימום העברות (פונקציה טהורה)
    settlements.test.js  בדיקות יחידה
    people.js            רשימת החבר'ה, צבעים, פורמט מטבע
    whatsapp.js          יצירת סיכום ל-WhatsApp
  App.jsx
  main.jsx
```
