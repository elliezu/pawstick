# PawStick

Sticky notes for your Windows desktop. No ads, no tracking.

한국어 안내는 [README.ko.md](README.ko.md)를 봐주세요.

![PawStick](docs/image.png)

---

## Why this exists

I went looking for a desktop sticky-note app and found that most of them come
with advertising attached. One of them read the browser address bar to collect
search terms and quietly planted bookmarks in Chrome.

A notepad should just be a notepad. So I built one.

- No advertising
- Nothing collected, nothing transmitted
- No account required
- No network access at all
- No automatic updates that add things you didn't ask for

The full source is in this repository. You can check for yourself.

---

## Features

**Sticks to your desktop.** Each note is its own window. Drag the masking tape
to move it, drag the folded corner to resize. Every note can be pinned on top
independently.

**Separate title line.** The title is bold automatically. Press `Enter` to move
down into the body.

**Markdown-style formatting.** Type `- ` for a bullet, `[] ` for a checkbox —
the characters disappear and turn into the real thing. `Tab` indents to a
sub-level and the bullet shape changes with it. Press `Backspace` on an empty
formatted line to drop the formatting.

**Checklists that keep going.** Press `Enter` at the end of a checkbox line and
the next line is a checkbox too, so long lists go quickly.

**Six colours.**

**Alarms.** Set a time per note and Windows will notify you.

**Saves as you type.** There is no save button. Position, size, colour and
checked state are all remembered. Close the app and reopen it — the notes that
were open come back where you left them.

**Automatic backups.** On launch, every six hours, and on quit. You choose the
folder. The twenty most recent backups are kept.

**Lives in the tray.** Close every window and PawStick stays in the system tray.
Right-click for a new note, the note list, backups, and start-with-Windows.

**Korean and English.** The interface follows your Windows language.

---

## Download

Grab it from [Releases](../../releases).

| File | What it is |
|---|---|
| `PawStick-x.x.x-setup.exe` | Installer. Adds Start menu and desktop shortcuts |
| `PawStick-x.x.x-portable.exe` | No install. Just run it |

Windows 10 or later, 64-bit.

### Windows will warn you on first run

You may see a blue "Windows protected your PC" screen.
Click **More info → Run anyway**.

This happens because the executable isn't code-signed. A certificate for an
individual developer runs into hundreds of dollars a year, which felt like a lot
for something given away for free. If your antivirus quarantines it, add an
exception.

If that makes you uneasy, read the source and build it yourself — instructions
are below.

---

## Where your notes are kept

```
%APPDATA%\pawstick\memos.json
```

One JSON file. Open it and you can read it. Copy that file and you have a backup.
Moving to another machine is just moving that file.

Uninstalling PawStick does not delete it. Reinstall and your notes are still there.

---

## Building it yourself

Requires Node.js 18 or later.

```bash
git clone https://github.com/elliezu/pawstick.git
cd pawstick
npm install
npm start          # run in development mode
npm run dist       # build installer and portable into dist/
```

---

## Licence

[GPL-3.0](LICENSE)

Use it, change it, share it. If you distribute a modified version, you have to
publish your source too.

That condition is deliberate. This exists because there was no sticky-note app
without advertising in it. I would rather nobody quietly bolted advertising onto
this code and handed it around.

---

## Made by

[StudioCats](https://studiocats.kr) — 3D Art & Design
