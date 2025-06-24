# BoatAttack Multiplayer Setup Guide

## Quick Start (After Unity Opens Successfully)

1. **Open Unity** and wait for all packages to finish importing
2. **Open the Main Menu scene**: `Assets/scenes/main_menu/main_menu.unity`
3. **Add the QuickMultiplayerStart script** to any GameObject in the scene

## Testing Multiplayer

### Method 1: Quick Test Script
1. In the scene, create an empty GameObject
2. Add the `QuickMultiplayerStart` component to it
3. Set `autoStartMultiplayer = true` in the inspector
4. Press Play - it will automatically connect to Photon and start multiplayer

### Method 2: Keyboard Controls (In Play Mode)
- Press **F1** to start multiplayer connection
- Press **F2** to start the race (master client only)

### Method 3: Multiple Instances
1. Build the project (File > Build Settings > Build)
2. Run the built executable
3. Also press Play in Unity Editor
4. Both instances will connect to the same room and race together

## Important Notes

### Photon Setup
- The project already has Photon PUN2 installed
- Uses the free Photon Cloud (no App ID needed for basic testing)
- Maximum 20 concurrent users on free plan

### Scenes
- **Main Menu**: `Assets/scenes/main_menu/main_menu.unity`
- **Race Scene**: `Assets/scenes/demo_Island/demo_Island.unity`

### Controls During Race
- **WASD** or **Arrow Keys** - Steer boat
- **Space** - Boost
- **H** - Toggle camera UI
- **Space** - Toggle camera modes

## Troubleshooting

### If You Get Compilation Errors
1. Wait for Unity to finish importing packages (check bottom status bar)
2. If errors persist, delete `Library` folder and restart Unity
3. Make sure all packages are imported properly

### If Photon Connection Fails
1. Check internet connection
2. Try restarting Unity
3. The free Photon plan has usage limits

### If Boats Don't Spawn in Multiplayer
1. Make sure you're in the `demo_Island` scene
2. Check that the `MultiplayerBoatSpawner` script is working
3. Look for any console errors

## Features Included

✅ **Photon PUN2 Networking**
✅ **Automatic Room Creation/Joining**
✅ **Synchronized Scene Loading**
✅ **Multiple Player Support (up to 4)**
✅ **Real-time Boat Racing**
✅ **Master Client Authority**
✅ **Player Join/Leave Handling**
✅ **Debug Information On-Screen**

## Scripts Involved

- `QuickMultiplayerStart.cs` - Easy multiplayer starter
- `BoatNetworkManager.cs` - Main networking manager
- `MultiplayerBoatSpawner.cs` - Spawns networked boats
- `NetworkedBoat.cs` - Handles boat networking
- `StartMultiplayerDemo.cs` - Demo starter script

## Next Steps

Once the basic multiplayer is working, you can:
1. Customize boat selection for each player
2. Add more race tracks
3. Implement race results and leaderboards
4. Add spectator mode
5. Customize the UI for better multiplayer experience

Enjoy racing! 🚤🏁 