# Receipt Sprint 🏆

A competitive receipt scanning app where teams compete to earn points by uploading shopping receipts. Built with React, Vite, Tailwind CSS, and Firebase.

## Features ✨

- 🔐 **Authentication** - Email/password and Google sign-in
- 🏆 **Competitions** - Create and join multiple competitions
- 👥 **Teams** - Form teams and compete together
- 📸 **Receipt Scanning** - Upload receipt images and earn points
- 🤖 **AI-Powered OCR** - Automatic receipt verification using GPT-4 Vision (prevents fraud!)
- 📊 **Real-time Leaderboards** - Track team rankings live
- 💯 **Point System** - Automatic calculation ($1 = 100 points)
- 🎯 **Clean UI** - Modern, responsive design with Tailwind CSS
- ⚙️ **Settings** - Configure OCR and manage account

## Tech Stack 🛠️

- **Frontend**: React 19, Vite 7
- **Styling**: Tailwind CSS 4
- **Routing**: React Router DOM 7
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Language**: JavaScript

## Quick Start 🚀

### Prerequisites

- Node.js 22.x
- npm or yarn
- Firebase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd fetch-sprint
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**

   a. Go to [Firebase Console](https://console.firebase.google.com/)
   
   b. Create a new project or use an existing one
   
   c. Enable the following services:
      - **Authentication** → Enable Email/Password and Google sign-in
      - **Firestore Database** → Create database in production mode
      - **Storage** → Enable Cloud Storage
   
   d. Get your Firebase config:
      - Go to Project Settings → General
      - Scroll to "Your apps" → Add web app
      - Copy the Firebase configuration
   
   e. Update `src/firebase.js` with your Firebase config:
      ```javascript
      const firebaseConfig = {
        apiKey: "your-api-key",
        authDomain: "your-project.firebaseapp.com",
        projectId: "your-project-id",
        storageBucket: "your-project.appspot.com",
        messagingSenderId: "your-sender-id",
        appId: "your-app-id"
      };
      ```

4. **Set up Firestore Security Rules**

   In Firebase Console → Firestore Database → Rules, use these rules:

   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow authenticated users to read all competitions
       match /competitions/{competition} {
         allow read: if request.auth != null;
         allow write: if request.auth != null;
       }
       
       // Teams
       match /teams/{team} {
         allow read: if request.auth != null;
         allow create: if request.auth != null;
         allow update: if request.auth != null;
       }
       
       // Receipts
       match /receipts/{receipt} {
         allow read: if request.auth != null;
         allow create: if request.auth != null;
       }
     }
   }
   ```

5. **Set up Storage Security Rules**

   In Firebase Console → Storage → Rules:

   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /receipts/{allPaths=**} {
         allow read: if request.auth != null;
         allow write: if request.auth != null;
       }
     }
   }
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser.

7. **Set up OpenAI for Receipt OCR** (Optional but recommended)
   
   For automatic receipt verification:
   - Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - Log into the app
   - Go to Settings → Add your OpenAI API key
   - Now receipts will be automatically verified!
   
   See `RECEIPT_OCR_SETUP.md` for detailed instructions.

## Usage Guide 📖

### For Users

1. **Sign Up/Login**
   - Create an account or sign in with Google
   
2. **Browse Competitions**
   - View all active competitions
   - See team counts and participant numbers

3. **Join a Competition**
   - Click on a competition to view details
   - Create a new team or join an existing one

4. **Upload Receipts**
   - Go to your team dashboard
   - Click "Upload Receipt"
   - Select receipt image and enter the total amount
   - Points are calculated automatically

5. **Track Progress**
   - View team leaderboard
   - Monitor your team's total points
   - See all uploaded receipts

### For Admins

1. **Create Competition**
   - Click "Create Competition" from competitions page
   - Fill in name, description, emoji, and optional end date
   - Submit to create

## Project Structure 📁

```
fetch-sprint/
├── src/
│   ├── context/
│   │   └── AuthContext.jsx       # Authentication context
│   ├── pages/
│   │   ├── Login.jsx              # Login/signup page
│   │   ├── Competitions.jsx       # List all competitions
│   │   ├── CompetitionDetail.jsx  # Competition details & teams
│   │   ├── TeamDashboard.jsx      # Team dashboard & receipt upload
│   │   └── CreateCompetition.jsx  # Create new competition
│   ├── App.jsx                    # Main app with routing
│   ├── firebase.js                # Firebase configuration
│   ├── main.jsx                   # App entry point
│   └── index.css                  # Global styles
├── public/
├── index.html
├── package.json
└── README.md
```

## Firebase Data Structure 🗄️

### Collections

**competitions**
```javascript
{
  name: string,
  description: string,
  emoji: string,
  endDate: string,
  teamCount: number,
  participantCount: number,
  status: "active",
  createdBy: string,
  createdAt: timestamp
}
```

**teams**
```javascript
{
  name: string,
  competitionId: string,
  members: [userId1, userId2, ...],
  memberEmails: [email1, email2, ...],
  totalPoints: number,
  receiptsCount: number,
  createdAt: timestamp,
  createdBy: string
}
```

**receipts**
```javascript
{
  teamId: string,
  competitionId: string,
  userId: string,
  userEmail: string,
  imageUrl: string,
  imageHash: string, // used to prevent duplicate uploads per competition
  amount: number,
  points: number,
  description: string,
  createdAt: timestamp,
  status: "approved"
}
```

## Points System 💯

- **Conversion Rate**: $1 = 100 points
- **Example**: A $25.50 receipt = 2,550 points
- **Calculation**: `points = Math.floor(amount * 100)`

## Building for Production 🏗️

```bash
npm run build
```

The build files will be in the `dist/` directory.

### Deploy to Firebase Hosting

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login and initialize:
   ```bash
   firebase login
   firebase init hosting
   ```

3. Deploy:
   ```bash
   npm run build
   firebase deploy
   ```

## Development Roadmap 🗺️

### Completed ✅
- [x] Landing page
- [x] Authentication (Email + Google)
- [x] Competition listing
- [x] Competition details
- [x] Team creation and joining
- [x] Receipt upload with image
- [x] Points calculation
- [x] Leaderboard
- [x] Team dashboard

### Future Enhancements 🚀
- [ ] Receipt OCR for automatic amount extraction
- [ ] Admin panel for competition management
- [ ] Push notifications
- [ ] Receipt approval workflow
- [ ] Team chat/messaging
- [ ] Prize distribution system
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] QR code for team invites

## Troubleshooting 🔧

### Common Issues

**Firebase errors**
- Make sure you've enabled Authentication, Firestore, and Storage in Firebase Console
- Check that your Firebase config in `src/firebase.js` is correct
- Verify security rules are properly set

**Build errors**
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Make sure you're using Node.js 22.x

**Receipt upload fails**
- Check Firebase Storage rules
- Verify internet connection
- Ensure file size is reasonable (< 5MB recommended)

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## License 📄

MIT License - feel free to use this project for your own purposes.

## Support 💬

For questions or issues, please open an issue on GitHub.

---

Built with ❤️ using React, Vite, and Firebase
