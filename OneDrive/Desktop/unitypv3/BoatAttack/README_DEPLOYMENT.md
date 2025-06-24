# 🚤 BoatAttack Racing - Vercel Deployment Guide

Deploy your multiplayer boat racing game to the web in minutes!

## 🎯 Quick Start

### 1. Fix Compilation Issues (If Any)
If Unity shows compilation errors:
- **Click "Enter Safe Mode"** in Unity
- Wait for Unity to load
- Go to **Assets → Refresh** (Ctrl+R)
- Unity should recompile successfully

### 2. Build for WebGL
1. Open Unity with the BoatAttack project
2. Go to **BoatAttack → Configure WebGL Settings** (optimizes for web)
3. Go to **BoatAttack → Build WebGL for Vercel**
4. Wait for build to complete (5-15 minutes)

### 3. Deploy to Vercel
```bash
# Option 1: Use the deployment script (Windows)
deploy-racing.bat

# Option 2: Manual deployment
cd BoatAttack
vercel --prod
```

## 🎮 Game Features

### 🏁 Racing Modes
- **Single Player**: Race against AI boats
- **Multiplayer**: Real-time racing with other players
- **Time Trials**: Beat your best times

### 🎯 Controls
- **WASD** or **Arrow Keys**: Steer boat
- **F9**: Quick restart race
- **F10**: Return to main menu
- **Mouse**: Navigate menus

### 🌊 Environments
- **Island Racing**: Beautiful tropical island circuit
- **Dynamic Water**: Realistic wave physics
- **Weather Effects**: Dynamic lighting and atmosphere

## 🔧 Technical Setup

### Prerequisites
- Unity 2020.3.23f1 or later
- Node.js (for Vercel CLI)
- Vercel account (free)

### Build Configuration
The WebGL build is optimized for:
- **Compression**: Gzip for faster loading
- **Memory**: 512MB allocation
- **Performance**: Optimized for web browsers
- **Compatibility**: Works on desktop and mobile

### Deployment Structure
```
BoatAttack/
├── WebGL-Build/           # Generated Unity WebGL build
│   ├── index.html         # Main game page
│   ├── Build/             # Game assets
│   └── TemplateData/      # Unity template files
├── vercel.json            # Vercel configuration
├── .vercelignore          # Files to exclude from deployment
└── deploy-racing.bat      # Automated deployment script
```

## 🚀 Deployment Options

### Option 1: Automated Script (Recommended)
```bash
# Windows
deploy-racing.bat

# The script will:
# 1. Check for WebGL build
# 2. Install Vercel CLI if needed
# 3. Deploy to production
# 4. Provide live URL
```

### Option 2: Manual Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd BoatAttack
vercel --prod

# Follow prompts to configure deployment
```

### Option 3: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Import Git repository
3. Set build command: `echo "Static deployment"`
4. Set output directory: `BoatAttack/WebGL-Build`
5. Deploy

## 🌐 Post-Deployment

### Sharing Your Game
Once deployed, you'll get a URL like:
- `https://boatattack-racing-yourname.vercel.app`

Share this URL with friends to play multiplayer races!

### Performance Tips
- **First Load**: May take 30-60 seconds to download
- **Subsequent Loads**: Much faster due to caching
- **Mobile**: Works on mobile browsers (touch controls)
- **Multiplayer**: Uses Photon for real-time networking

### Troubleshooting
- **Build Fails**: Check Unity console for errors
- **Deployment Fails**: Verify Vercel account and CLI
- **Game Won't Load**: Check browser console for errors
- **Multiplayer Issues**: Verify Photon App ID in Unity

## 🎯 Multiplayer Setup

### Photon Configuration
The game uses Photon PUN2 for multiplayer:
1. **Automatic Connection**: Game connects to Photon automatically
2. **Room Creation**: Players can create/join rooms
3. **Real-time Racing**: Synchronized boat physics
4. **Cross-platform**: Works across all devices

### Network Features
- **Real-time boat synchronization**
- **Lap tracking across players**
- **Race results and leaderboards**
- **Automatic reconnection**

## 📱 Platform Support

### Desktop Browsers
- ✅ Chrome (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge

### Mobile Browsers
- ✅ Chrome Mobile
- ✅ Safari Mobile
- ✅ Samsung Internet
- ⚠️ Performance may vary

### Controls by Platform
- **Desktop**: Keyboard (WASD/Arrows) + Mouse
- **Mobile**: Touch controls + Gyroscope
- **Gamepad**: Xbox/PlayStation controllers supported

## 🔄 Updates and Maintenance

### Updating the Game
1. Make changes in Unity
2. Rebuild WebGL: **BoatAttack → Build WebGL for Vercel**
3. Redeploy: Run `deploy-racing.bat` or `vercel --prod`

### Monitoring
- **Vercel Dashboard**: View deployment status and analytics
- **Unity Analytics**: Track player engagement
- **Photon Dashboard**: Monitor multiplayer usage

## 🎉 Success!

Your BoatAttack Racing game is now live on the web! 

**Next Steps:**
- Share the URL with friends
- Test multiplayer functionality
- Monitor performance and player feedback
- Consider adding new features and tracks

**Need Help?**
- Check Unity console for build errors
- Verify Vercel deployment logs
- Test in different browsers
- Check Photon connection status

Happy Racing! 🏁 