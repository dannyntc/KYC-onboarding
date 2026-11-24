# KYC-onboarding: User Manual

A step-by-step guide to the KYC-onboarding demo. It assumes no compliance or technical background.

- **Live demo:** https://kyc-onboarding-dannyntc.vercel.app
- **Source code:** https://github.com/dannyntc/KYC-onboarding

> **Everything in this demo is fictional.** No real people, companies or bank data are used. This is a prototype for showing an idea. It is not a real compliance system.

---

## Contents

1. [What this demo is](#1-what-this-demo-is)
2. [Key terms](#2-key-terms)
3. [Online demo vs. running it on your own computer](#3-online-demo-vs-running-it-on-your-own-computer)
4. [Finding your way around the screen](#4-finding-your-way-around-the-screen)
5. [The guided tour](#5-the-guided-tour)
6. [Step by step: the onboarding queue](#6-step-by-step-the-onboarding-queue)
7. [Step by step: a client's KYC file](#7-step-by-step-a-clients-kyc-file)
8. [Step by step: recording a decision](#8-step-by-step-recording-a-decision)
9. [Demo roles](#9-demo-roles)
10. [The KYC memo assistant](#10-the-kyc-memo-assistant)
11. [The regulatory library](#11-the-regulatory-library)
12. [Suggested walkthroughs (the 12 applicants)](#12-suggested-walkthroughs-the-12-applicants)
13. [Running the demo on your own computer](#13-running-the-demo-on-your-own-computer)
14. [Troubleshooting](#14-troubleshooting)
15. [Limitations](#15-limitations)

---

## 1. What this demo is

Before a bank accepts a new client, it must check who they really are and where their money comes from. This process is called **KYC (know your customer)**.

KYC-onboarding shows how a bank analyst could work through these checks for each new applicant. They confirm identity, look at who really owns the money, check watch lists, and compare declared wealth with documents. Then a **person** records a decision.

The demo follows three principles:

- **Human-led.** Rules and an assistant can *suggest*, but only a person can approve or reject.
- **Traceable.** Every finding links back to the record it came from, such as a passport or a screening result.
- **Recorded.** Every action is written to an audit trail that cannot be edited.

## 2. Key terms

| Term | Meaning |
|---|---|
| **KYC** | Know your customer: checking a new client's identity and money before accepting them |
| **Applicant** | A person asking to become a client |
| **KYC file** | One applicant's page, with all their checks in one place |
| **Beneficial owner** | The real person who ultimately owns or controls a client or company |
| **Screening** | Checking a name against official watch lists |
| **PEP** | Politically exposed person: someone in a senior public role, or their family. They carry a higher risk of suspicious activities, so they need extra checks |
| **Sanctions list** | People and organisations a bank is not allowed to deal with |
| **Adverse media** | Negative news coverage linked to a person |
| **False positive** | A watch-list "match" that turns out to be a different person |
| **Source of wealth** | How a person built up their total wealth (e.g. selling a company, a salary, an inheritance) |
| **AML** | Anti-money laundering: checks that stop criminal money passing through the bank |
| **Risk rating** | Low, Medium or High: how closely the bank should watch this client |
| **Senior approver** | A second, more senior person who must also approve high-risk clients ("four-eyes" approval) |
| **Audit trail** | A permanent log of who did what, and when |
| **Template** | Memo text built from the records, used instead of a real AI model |

## 3. Online demo vs. running it on your own computer

There are two ways to use the demo.

| | **Online demo** (live website) | **On your own computer** |
|---|---|---|
| How to open | Visit https://kyc-onboarding-dannyntc.vercel.app | Follow [section 13](#13-running-the-demo-on-your-own-computer) |
| Can you see everything? | Yes | Yes |
| Can you click Approve, Save, etc.? | Yes: everything works | Yes: everything works |
| Can you switch demo roles? | Yes | Yes |
| Who sees your changes? | **Everyone** who visits the site (one shared database) | Only you |
| Start again from fresh data | **Reset demo data** in the sidebar | **Reset demo data** in the sidebar, or `npm run db:reset` |

Online, every visitor shares the same data, so another visitor may already have decided a file. Click **Reset demo data** in the sidebar (Analyst or Senior approver role) to restore the 12 starting applicants. It asks you to confirm, and it erases every saved review, memo and audit entry for everyone. Never enter real client information.

## 4. Finding your way around the screen

**Left sidebar** (on phones, at the top of the screen):

- **Onboarding queue:** the list of all applicants. This is the home page.
- **Regulatory library:** the Singapore regulations (MAS Notice 626) that relate to each check.
- **▶ Guided tour:** starts the step-by-step pop-up tour.
- **Demo role:** a drop-down to switch between *Read-only access*, *Analyst* and *Senior approver*, plus a **Switch role** button. This is a demo tool, not a real login.
- **Reset demo data:** restores the 12 starting applicants and erases every saved review, memo and audit entry, for everyone (hidden for *Read-only access*).


**Links that look like `DOC-002`, `SCR-001` or `IDV-001`:** these are **record IDs**. Click one to jump to that record on the page.

| Prefix | Record type |
|---|---|
| `ONB-` | KYC file (onboarding case) |
| `CLI-` | Client |
| `IDV-` | Identity document |
| `SCR-` | Screening result |
| `DOC-` | Supporting document (e.g. source of wealth) |
| `REL-` | Ownership relationship |
| `MAS-626-` | Regulation reference |

## 5. The guided tour

The quickest way to understand the demo is the built-in tour. It takes about 5 minutes.

1. Open the demo. Each time the onboarding queue is opened or refreshed, an **About this demo** bubble appears automatically. (Moving back to the queue from inside the app does not reopen it.)
2. Click **Start tour**.
3. Read each bubble. The highlighted part of the screen is what the bubble is about.
4. Click **Next** to continue, or **Back** to go back. You can also use your keyboard's arrow keys. The tour moves between pages by itself.
5. Close it at any time with the **×** or the **Esc** key.
6. To restart later, click **▶ Guided tour** in the sidebar.

**The 25 steps of the tour:**

| Step | Page | What it shows |
|---|---|---|
| 1 | Queue | About this demo: its purpose, faster checks with better controls, and MAS Notice 626 |
| 2 | Queue | Welcome: what KYC is |
| 3 | Queue | The sidebar: queue, regulatory library and the tour link |
| 4 | Queue | The four summary counters |
| 5 | Queue | Search and filters |
| 6 | Queue | The list of applicants and "suggested risk" |
| 7 | Queue | Outstanding items that block approval |
| 8 | Sarah Yeo (ONB-006) | The KYC file and its overview |
| 9 | Sarah Yeo | Identity checks |
| 10 | Sarah Yeo | Source of wealth fully backed by documents |
| 11 | Sarah Yeo | The suggested risk and the analyst's final rating |
| 12 | Sarah Yeo | The decision panel |
| 13 | Sarah Yeo | The audit history |
| 14 | Darren Ho (ONB-007) | An expired passport blocks approval |
| 15 | Ethan Sim (ONB-009) | A sanctions false alarm |
| 16 | Aisha Malik (ONB-008) | A politically exposed person (PEP) |
| 17 | Aisha Malik | Senior approval and the role switch |
| 18 | Priya Menon (ONB-003) | Beneficial ownership: an owner shared with other clients |
| 19 | Daniel Lim (ONB-002) | A source-of-wealth gap |
| 20 | Daniel Lim | The KYC memo assistant |
| 21 | Daniel Lim | Memo history |
| 22 | Daniel Lim | The regulatory references in each section |
| 23 | Daniel Lim | Reset demo data |
| 24 | Regulatory library | The MAS Notice 626 references and their review status |
| 25 | Regulatory library | The end of the tour |

## 6. Step by step: the onboarding queue

The queue is the home page. Click **Onboarding queue** in the sidebar to return to it.

1. **Read the four summary tiles** at the top:
   - *Applications in progress*
   - *Pending senior approval*
   - *Information requested*
   - *Decided*
2. **Read the applications table.** Each row is one applicant and shows:
   - **File:** the KYC file ID (e.g. ONB-006)
   - **Applicant:** name and client ID
   - **Application date**
   - **Suggested risk:** Low / Medium / High, worked out by fixed rules from the records, not by AI
   - **Outstanding items:** how many things still block approval ("None" means nothing is in the way)
   - **Status:** In progress, Information requested, Pending senior approval, Approved or Rejected
3. **Search:** type a name, file ID or client ID into the search box.
4. **Filter:** choose a suggested risk and/or status from the drop-downs.
5. Click **Apply filters**.
6. **Open a file:** click the file ID or **Open file**.

On a phone, each row appears as a card with labels.

## 7. Step by step: a client's KYC file

A KYC file has the evidence on the left and the decision tools on the right. (On a phone, everything is in one column.) Work down the left side first.

**Left side: the checks**

1. **Applicant overview.** Client ID, application date, declared wealth, expected monthly activity and file status.
2. **Identity & documents.** The passport and proof of address, each marked:
   - **Verified:** checked and fine
   - **Expired:** the document is out of date, which blocks approval
   - **Missing:** not supplied, which blocks approval
3. **Beneficial ownership.** Who really owns or controls the money. If the same owner appears behind *other* clients, they're listed here with links to their files.
4. **Screening.** Watch-list matches (PEP, sanctions, adverse media), each showing the match strength and the list entry. An undecided match is shown as **Potential match**, and it blocks approval until an analyst decides.
5. **Source of wealth & funds.** The declared wealth, each supporting document and how much it backs up, the corroborated total, and any amount **not corroborated**.

Each section lists **candidate regulatory references** (e.g. `MAS-626-6.9`). Click one to see it in the regulatory library.

**Right side: the decision tools**

6. **Risk assessment.** The **suggested rating** and the reasons behind it, each linked to its evidence. Below it is the form for the analyst's own final rating.
7. **KYC memo assistant.** A drafted KYC memo for the file ([section 10](#10-the-kyc-memo-assistant)).
8. **Decision.** A red **Outstanding before approval** box lists every blocker, followed by the note box and the decision buttons.
9. **Memo history** and **Audit history.** Earlier memos and every recorded action.

## 8. Step by step: recording a decision

### 8.1 Decide on a screening match (if there is one)

1. In **Screening**, read the list entry and compare it with the applicant's details.
2. Type a reason in **Reason for decision** (at least 10 characters). For example: *"Different birth year and nationality."*
3. Click either button:
   - **Clear as false positive** if it's a different person.
   - **Confirm match** if it really is the applicant.
4. The match updates, the suggested risk may change, and the action is added to the audit history.

### 8.2 Save a final risk rating

1. In **Risk assessment**, choose a **Final risk rating** (Low, Medium or High).
2. Type your **Reasons for rating** (at least 20 characters).
   - If your rating is *lower* than the suggested one, write a fuller explanation (at least 50 characters).
3. Click **Save risk rating**.

### 8.3 Approve, reject or ask for more information

1. Check the **Outstanding before approval** box. **Approve** stays greyed out until it's empty.
2. Optionally type a **decision note**. You can click **Add draft to note** to copy the assistant's draft in, then edit it.
3. Click one of:
   - **Approve:** accept the applicant. For a **High** rating, an Analyst's approval moves the file to *Pending senior approval* instead (see below).
   - **Reject:** decline the applicant. A note is required.
   - **Request information:** ask the applicant for more documents. A note is required, and the status becomes *Information requested*.
4. Once a file is Approved or Rejected, it can no longer be changed.

### 8.4 Give senior approval (high-risk applicants)

1. As **Analyst**, approve the high-risk file. Its status becomes **Pending senior approval**.
2. In the sidebar, choose **Senior approver** and click **Switch role**. You stay on the same page.
3. Click **Give senior approval**. The status becomes **Approved**.
4. The audit history shows both approvals and who gave them.

### What blocks approval

Approval is blocked if any of these are true:

- An identity document is expired or missing.
- A screening match is still undecided.
- No final risk rating, or the reasons are too short.
- The rating is High and you are not a Senior approver.
- A downgraded rating hasn't been properly explained.

The server enforces these rules, so they can't be bypassed.

## 9. Demo roles

Use the **Demo role** drop-down in the sidebar, then click **Switch role**. You stay on the page you were on.

| Role | What it can do |
|---|---|
| **Read-only access** | View everything. Decision and review buttons are hidden, and a note explains why |
| **Analyst** | The default. Decide screening matches, save ratings, approve Low/Medium files, reject, request information |
| **Senior approver** | Everything an Analyst can do, plus give the second approval on High-risk files |

The role switch is a demonstration only. It is **not** a real login or security control.

## 10. The KYC memo assistant

The assistant writes a draft summary to save the analyst time.

- Every statement it makes links to a record, so you can check it.
- It suggests a risk rating and a next step, clearly labelled **suggestions for the analyst**.
- It **cannot** approve, reject, or declare that someone *is* a PEP or sanctioned. Drafts containing such statements are automatically rejected.

**Template mode vs. AI mode:**

- **Template mode** is the default. The memo is built from the records using a template, and no AI is called. It is labelled **TEMPLATE**.
- **AI mode** sends the fictional file to an AI model. It needs an OpenAI key to be configured and is labelled **AI**. It has not yet been tested with a real key.

**To create a draft (locally):**

1. Open a KYC file.
2. In **KYC memo assistant**, click **Generate draft KYC memo**.
3. Read the draft, click the record links to check its claims, and optionally click **Add draft to note** in the Decision panel.
4. Earlier memos are listed in **Memo history**. Open **View evidence used for this memo** to see exactly what it was based on.

Online, the assistant shows a **preview (not saved)** instead.

## 11. The regulatory library

Click **Regulatory library** in the sidebar.

- It lists paragraphs of **MAS Notice 626**, Singapore's anti-money-laundering rules for banks, that relate to each check.
- Each entry links to the official MAS document.
- These links are **candidates for human review**, not approved policy. A compliance reviewer must sign off a reference before it is given to the AI assistant. By default, none have been signed off.

## 12. Suggested walkthroughs (the 12 applicants)

| File | Applicant | Story | What to do (locally) |
|---|---|---|---|
| ONB-001 | Amelia Tan | Clean: identity verified, wealth fully documented by employment income | Save a Low rating with reasons, then approve |
| ONB-002 | Daniel Lim | Source-of-wealth gap: declares SGD 8M, documents back SGD 3M | Generate a KYC draft. Request information about the missing SGD 5M |
| ONB-003 | Priya Menon | Shares a hidden owner with other clients | Read **Beneficial ownership** and follow the links to the related clients |
| ONB-004 | Marcus Lee | Wealth documented by a property sale and employment income | Save a Low rating with reasons, then approve |
| ONB-005 | Nadia Rahman | The other side of the shared-owner link | Compare with ONB-003 |
| ONB-006 | Sarah Yeo | Clean | Save a Low rating with reasons, then approve |
| ONB-007 | Darren Ho | Expired passport | Note the blocker; request information |
| ONB-008 | Aisha Malik | Possible PEP | Confirm the match, so risk becomes High. Approve as Analyst (pending), then switch to Senior approver and give senior approval |
| ONB-009 | Ethan Sim | Sanctions name match, different person | Clear it as a false positive with a reason. Risk drops to Low |
| ONB-010 | Isabelle Tay | Negative news about a namesake | Decide: clear or confirm (confirm makes risk Medium) |
| ONB-011 | Raj Mehta | Missing proof of address | Note the blocker; request information |
| ONB-012 | Rachel Chan | Clean | Approve |

**A 5-minute demo for an audience:**

1. Queue (step 6)
2. ONB-006: a clean approval
3. ONB-009: clear a false alarm
4. ONB-008: PEP and senior approval
5. ONB-002: the assistant's draft and the wealth gap
6. The audit history

## 13. Running the demo on your own computer

Running locally lets you click every button. You need **Node.js 24** and **npm** installed.

1. Download the code:
   ```sh
   git clone https://github.com/dannyntc/KYC-onboarding.git
   cd KYC-onboarding
   ```
2. Install and set up:
   ```sh
   npm install
   cp -n .env.example .env
   npm run db:migrate
   npm run db:seed
   ```
3. Start the app:
   ```sh
   npm run dev
   ```
4. Open http://127.0.0.1:3000 in your browser.

**Useful extras:**

- **See the look-only version (nothing can be saved):** `KYC_ONBOARDING_PUBLIC_DEMO=1 npm run dev`
- **Start again from fresh data:** `npm run db:reset`. **Warning:** this permanently deletes all your demo decisions and audit history.

## 14. Troubleshooting

| Problem | What to do |
|---|---|
| A file is already decided | Someone else decided it on the shared online demo. Click **Reset demo data** in the sidebar |
| **Approve** stays greyed out locally | Read the **Outstanding before approval** box and resolve each item first |
| "This file changed. Reload and try again." | Someone (or another tab) changed the file. Copy your note, reload the page, and try again |
| "Read-only demo role cannot change cases." | Switch the demo role to Analyst |
| The tour doesn't appear | Click **▶ Guided tour** in the sidebar |
| A page looks out of date after updating the code | Stop the app, delete the `.next` folder, and run `npm run dev` again |
| A red "hydration" message appears locally | Usually caused by a browser extension. It's harmless |

## 15. Limitations

- All data is fictional. **Never enter real client information.**
- It is a prototype, **not** a compliance control.
- The demo roles are not real logins.
- The local database is not tamper-proof.
- Screening results, documents and ownership records are synthetic. There is no real ID verification or document upload.
- AI live mode has not been verified with a real API key.
- Regulatory references are candidates. A qualified compliance reviewer must confirm them.
- No time savings or accuracy improvements have been measured.
