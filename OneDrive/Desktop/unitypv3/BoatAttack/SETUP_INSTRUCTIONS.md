# Quick Setup Instructions for BoatAttack Multiplayer

## 🚨 IMMEDIATE SETUP (5 Minutes)

### Step 1: Fix Compiler Errors ✅
The PhotonEditorUtils.cs error should now be fixed. Unity will recompile automatically.

### Step 2: Configure Photon Network (Required)
1. **Get Photon App ID**: Go to [photonengine.com](https://photonengine.com) → Sign up (free) → Create PUN2 App
2. **Configure Unity**: 
   - Open `Assets/Photon/PhotonUnityNetworking/Resources/PhotonServerSettings`
   - Paste your App ID in "App Id Realtime" field
   - Set Region to "us" or your region

### Step 3: Quick Test Setup (1 Minute)
1. **Open Demo Scene**: `Assets/scenes/demo_Island/demo_Island.unity`
2. **Add Test Components**:
   - Create empty GameObject named "MultiplayerManager"
   - Add `BoatMultiplayerTest` component
   - Add `MultiplayerBoatSpawner` component  
   - Add `PhotonView` component
3. **Configure Spawner**:
   - In `MultiplayerBoatSpawner`, set array size to 4
   - Assign boat prefabs from `Assets/Objects/boats/`:
     - `Interceptor.prefab`
     - `renegade.prefab` 
     - (You can duplicate these or find other boats)
4. **Enable Auto Test**:
   - Check "Auto Connect" in `BoatMultiplayerTest`
   - Check "Test Mode" in `MultiplayerBoatSpawner`

### Step 4: Test Multiplayer! 🚤
1. **Click Play** - It will auto-connect to Photon and start a race!
2. **Test with Friend**: Build → Share build → Both join same room
3. **Multiple Windows**: `File > Build & Run` → Run 2+ instances

## 🎮 Controls
- **WASD** or **Arrow Keys**: Steer boat
- **Space**: Brake/Reverse  
- **Mouse**: Look around

## ⚡ If Something Goes Wrong

### Can't Connect to Photon?
- Check internet connection
- Verify App ID is correct  
- Try different region (eu, asia, jp)

### Boats Not Spawning?
- Make sure boat prefabs are assigned
- Check WaypointGroup exists in scene
- Verify demo_Island scene is loaded

### Build Errors?
- Switch to WebGL platform: `File > Build Settings > WebGL`
- Set compression to Gzip
- Reduce memory to 512MB

## 🌐 Deploy to Web (After Testing)
1. **Build**: `File > Build Settings > WebGL > Build`
2. **Deploy**: Run `deploy.bat` or `vercel deploy --prod`
3. **Share**: Send URL to friends for online multiplayer!

---
**🏁 You should now have a working multiplayer boat racing game!**

**Next**: Test locally → Build for WebGL → Deploy online 