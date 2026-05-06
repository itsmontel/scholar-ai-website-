# WriteScholar iOS

Native SwiftUI app for iOS. Talks to the existing WriteScholar Node.js backend
at `https://writescholar.com/api` (same endpoints as the web app).

## Status

**Chapter 3 / 7 — scaffold + onboarding + auth + Study Pack flagship.**
The Study tab is fully wired against the existing
`POST /api/analysis/generate-study-pack` endpoint. Native iOS renderers
for Lesson (paginated slides), Flashcards (swipe deck with 3D flip),
and Quiz (MC/TF/fill-blank with haptics + score screen). Crossword,
Crater Blast, and Word Tower show "Chapter 5" placeholders that link
out to the web for now.

### Backend additions needed (small, Chapter 2.5)

The iOS app calls these — add the handlers when convenient:

- `POST /api/auth/apple` — verify Apple identity token, find/create user,
  return `{ user, token }` (same shape as `/auth/login`). Body:
  `{ identityToken, authorizationCode, firstName?, lastName?, email?, appleUserId }`.
- `POST /api/auth/google/native` — verify a Google ID token from the iOS
  Sign-In SDK, find/create user, return `{ user, token }`. Body:
  `{ idToken, email, name }`.

Until those exist, Apple-button taps will surface a friendly error and
Google taps show a "coming soon" message.

## Build prerequisites

- macOS 14+ with Xcode 15.3 or newer
- Apple Developer account (for code signing + Sign in with Apple)
- [XcodeGen](https://github.com/yonaskolb/XcodeGen) — `brew install xcodegen`

## First-time setup

```bash
cd ios/WriteScholar

# 1. Edit project.yml and put your Apple Developer team ID in DEVELOPMENT_TEAM.

# 2. Generate the Xcode project:
xcodegen generate

# 3. Open it:
open WriteScholar.xcodeproj

# 4. Pick your team in Signing & Capabilities, build, run on Simulator (Cmd+R).
```

## After pulling changes

If `project.yml` or files added/removed: re-run `xcodegen generate`.
Source-only changes don't need regeneration.

## Troubleshooting

- **`xcodebuild` complains about Command Line Tools** — your `xcode-select`
  is pointing at the wrong path. Fix:
  ```bash
  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
  ```
- **No simulators show up** — open Xcode → Settings → Platforms → install an iOS
  Simulator runtime (iOS 17+).
- **Custom fonts not rendering** — drop `.ttf` files into `Resources/`, then
  re-run `xcodegen generate` so Xcode picks them up. The app falls back to
  system fonts so missing custom fonts won't break the build.

## Folder map

```
WriteScholar/
├── WriteScholarApp.swift            # @main App entry
├── ContentView.swift                # Onboarding → Auth → Home router
├── DesignSystem/
│   ├── WSColors.swift               # Brand color tokens
│   ├── WSTypography.swift           # Font + text-style extensions
│   ├── WSGradients.swift            # Brand gradients
│   ├── WSButtonStyle.swift          # Primary/secondary/tertiary + Haptics
│   ├── WSCard.swift                 # Reusable card view modifier
│   ├── WSTextField.swift            # Brand text input (used in auth)
│   ├── WSSquigglyUnderline.swift    # Hand-drawn underline accent
│   └── WSAnimatedImage.swift        # ImageIO-driven WebP/GIF player
├── Onboarding/
│   ├── OnboardingFlow.swift         # 7-page coordinator + page indicator
│   ├── OnboardingPage.swift         # Page model
│   └── Pages/                       # 7 hero illustrations using real mascots
│       ├── WelcomeHero.swift
│       ├── EssayAnalyzerHero.swift
│       ├── StudyToolsHero.swift
│       ├── FlashcardsHero.swift
│       ├── GamesHero.swift
│       ├── LibraryHero.swift
│       └── GetStartedHero.swift
├── Auth/
│   ├── AuthAPI.swift                # /auth endpoint helpers
│   ├── AuthSession.swift            # ObservableObject managing auth state
│   └── Views/
│       ├── AuthFlowView.swift       # Welcome + method picker
│       ├── SignInView.swift         # Email + password login
│       ├── SignUpView.swift         # Email + password registration
│       └── SignUpSuccessView.swift  # "Check your inbox" screen
├── Networking/
│   ├── APIConfig.swift              # Base URL per build configuration
│   ├── APIClient.swift              # async/await typed HTTP client
│   └── KeychainStore.swift          # Secure JWT persistence
├── Models/
│   └── WSUser.swift                 # User payload from /auth/login
├── Resources/                       # Mascot WebPs + screenshot PNGs
│   ├── mascot-dance.webp            # Dancing (used on Welcome + GetStarted)
│   ├── mascot-laptop.webp           # At laptop (Library + Sign Up)
│   ├── mascot-paper.webp            # Writing (Essay + Sign In)
│   ├── mascot-study.webp            # Reading (Study Tools)
│   ├── main-logo.png
│   └── screenshot-*.png             # Real product screenshots from web
└── Assets.xcassets/                 # AppIcon, AccentColor, 14 brand colors
```

## Next chapters (planned)

- **Chapter 2.5** — Backend `/auth/apple` + `/auth/google/native` handlers (small)
- **Chapter 4** — Analyze Paper (essay feedback flow)
- **Chapter 5** — Crater Blast + Word Tower native renderers (replace placeholders)
- **Chapter 6** — Library + RevenueCat IAP (saved packs + subscription)
- **Chapter 7** — TestFlight build + polish

## Fonts (TODO)

Drop these `.ttf` files into `WriteScholar/Resources/`:
- `EBGaramond-Regular.ttf`, `EBGaramond-Bold.ttf` — get from Google Fonts
- `Nunito-Regular.ttf`, `Nunito-SemiBold.ttf`, `Nunito-Bold.ttf` — get from Google Fonts

Until those land, the app falls back to system fonts (`.serif` for headlines,
SF Pro Rounded for body) — looks fine, just not 100% brand-matched.
