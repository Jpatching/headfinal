# BoatAttack Multiplayer Setup & Deployment Guide

## 🎮 Overview

This is a multiplayer-enabled version of Unity's BoatAttack sample project, featuring:
- **Photon PUN2 Networking** for real-time multiplayer
- **WebGL Deployment** ready for Vercel
- **Cross-platform Support** (Desktop, Mobile, Web)
- **4-Player Racing** with synchronized boat physics

## 🛠️ Unity Version Compatibility

| Unity Version | Status | Notes |
|---------------|--------|-------|
| 2020.3.x LTS | ✅ Recommended | Current project version |
| 2021.3.x LTS | ✅ Compatible | Requires minor updates |
| 2022.3.x LTS | ✅ Compatible | Full feature support |
| 2023.2.x+ | ✅ Compatible | Latest features available |

## 🚀 Quick Start

### 1. Open in Unity
```bash
"C:\Program Files\Unity\Hub\Editor\2020.3.23f1\Editor\Unity.exe" -projectPath "path\to\BoatAttack\BoatAttack"
```

### 2. Configure Photon
1. Open `Assets/Photon/PhotonUnityNetworking/Resources/PhotonServerSettings`
2. Enter your Photon App ID (get free at [photonengine.com](https://photonengine.com))
3. Set region to "us" or your preferred region

### 3. Test Multiplayer (Option A: Quick Test)
1. Open scene: `Assets/scenes/demo_Island/demo_Island.unity`
2. Add `BoatMultiplayerTest` component to any GameObject
3. Add `MultiplayerBoatSpawner` component to any GameObject
4. Assign boat prefabs in `boatPrefabs` array
5. Enable `Auto Connect` and `Test Mode`
6. Click Play - it will auto-connect and start multiplayer race

### 4. Test Multiplayer (Option B: Full Setup)
1. Create a lobby scene with UI
2. Add `BoatNetworkManager` component
3. Connect UI elements to the network manager
4. Build and test with multiple instances

## 🌐 WebGL Deployment

### Build for WebGL
1. In Unity, go to `File > Build Settings`
2. Select `WebGL` platform
3. Click `Switch Platform`
4. Configure settings:
   - **Compression Format**: Gzip
   - **Memory Size**: 512 MB
   - **Exception Support**: None
   - **Data Caching**: Disabled
5. Click `Build` and select `WebGL-Build` folder

### Deploy to Vercel
```bash
# From BoatAttack directory
vercel deploy

# Or for production
vercel deploy --prod
```

#### Manual Vercel Setup
1. Install Vercel CLI: `npm i -g vercel`
2. In BoatAttack folder: `vercel init`
3. Follow prompts to link your project
4. Deploy: `vercel deploy --prod`

## 📁 Project Structure

```
BoatAttack/
├── BoatAttack/                     # Unity project
│   ├── Assets/
│   │   ├── Scripts/
│   │   │   ├── GameSystem/
│   │   │   │   ├── BoatNetworkManager.cs      # Main networking
│   │   │   │   ├── MultiplayerBoatSpawner.cs  # Boat spawning
│   │   │   │   ├── BoatMultiplayerTest.cs     # Quick test
│   │   │   │   └── RaceManager.cs             # Updated for MP
│   │   │   ├── Boat/
│   │   │   │   └── NetworkedBoat.cs           # Boat networking
│   │   │   └── UI/
│   │   │       └── MultiplayerLobbyUI.cs      # Lobby interface
│   │   └── Photon/                            # Networking assets
├── WebGL-Build/                    # Generated build output
├── vercel.json                     # Deployment config
└── .vercelignore                   # Deploy exclusions
```

## 🎮 Multiplayer Features

### Networking Components
- **BoatNetworkManager**: Handles connections, rooms, and player management
- **NetworkedBoat**: Synchronizes boat position, rotation, and race stats
- **MultiplayerBoatSpawner**: Creates networked boats for each player
- **BoatMultiplayerTest**: Quick testing without full UI setup

### Synchronized Data
- Boat position and rotation
- Velocity and angular velocity
- Lap count and percentage
- Race position/place
- Checkpoint crossings
- Race finish events

## 🔧 Configuration

### Photon Settings
```csharp
// In PhotonServerSettings.asset
App Id Realtime: "your-photon-app-id"
Region: "us" // or your preferred region
```

### Test Mode Setup
```csharp
// BoatMultiplayerTest component
[Header("Test Settings")]
public bool autoConnect = true;          // Auto-connect on start
public string testRoomName = "BoatTest"; // Room name
public string testPlayerName = "Player"; // Player prefix
```

### WebGL Optimization
```csharp
// Recommended settings for deployment
PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Gzip;
PlayerSettings.WebGL.memorySize = 512; // MB
PlayerSettings.WebGL.exceptionSupport = WebGLExceptionSupport.None;
```

## 🚨 Troubleshooting

### Common Issues

**1. Photon Connection Failed**
- Check App ID in PhotonServerSettings
- Verify internet connection
- Try different region (us, eu, asia)

**2. Boats Not Spawning**
- Ensure WaypointGroup exists in scene
- Check boat prefab assignments
- Verify NetworkedBoat component is added

**3. WebGL Build Issues**
- Use Unity 2020.3+ for better WebGL support
- Enable Gzip compression
- Reduce memory size if builds fail

**4. Vercel Deployment Failed**
- Check .vercelignore is excluding Unity files
- Ensure WebGL-Build folder exists
- Verify vercel.json configuration

### Performance Tips
- Use Gzip compression for smaller builds
- Set memory limit to 512MB or lower
- Disable unnecessary Unity features for WebGL
- Test on multiple browsers

## 🌍 Live Demo
After deployment, your game will be available at:
`https://your-project-name.vercel.app`

## 📞 Support
- Unity BoatAttack: [Unity Learn](https://learn.unity.com)
- Photon PUN2: [Photon Documentation](https://doc.photonengine.com/en-us/pun/current)
- Vercel: [Vercel Documentation](https://vercel.com/docs)

## 🏆 Game Features
- **4-Player Multiplayer Racing**
- **Real-time Physics Synchronization**
- **Cross-platform Compatibility**
- **WebGL Browser Support**
- **Mobile Touch Controls**
- **Race Statistics & Leaderboards**

Enjoy your multiplayer boat racing experience! 🚤💨 