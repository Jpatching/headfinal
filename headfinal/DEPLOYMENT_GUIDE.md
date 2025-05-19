# Deployed Application Guide

## Deployment Information

The application has been successfully deployed to Vercel:

- **Production URL**: [https://headfinal-602ed02mn-jpatchings-projects.vercel.app](https://headfinal-602ed02mn-jpatchings-projects.vercel.app)

## Connecting to the Game

### Option 1: Use an Existing Match

We've verified that an existing match is ready for testing:

- **Match ID**: 908d0710-389b-4902-9fa2-f91d1f6514f9
- **Player 1**: 5NWG1LUWZTpsMJc4po8SCVxAqfUMLvXYx5zGXF5GHZNp
- **Player 2**: FcEVQnBpPikXQD2WHf7rDFQZr1anxVB3CRAsG8z2GkCR
- **Bet Amount**: 0.01 SOL
- **Status**: active

To connect to this match:

1. Visit: [https://headfinal-602ed02mn-jpatchings-projects.vercel.app/play/908d0710-389b-4902-9fa2-f91d1f6514f9](https://headfinal-602ed02mn-jpatchings-projects.vercel.app/play/908d0710-389b-4902-9fa2-f91d1f6514f9)
2. Authenticate with Vercel when prompted
3. Enter your wallet address (use one of the addresses above to be recognized as a player)

### Option 2: Create a New Match

To create a new match for testing:

1. Visit: [https://headfinal-602ed02mn-jpatchings-projects.vercel.app](https://headfinal-602ed02mn-jpatchings-projects.vercel.app)
2. Connect your wallet
3. Select bet amount (recommend 0.01 SOL for testing)
4. Create a match and share the match ID with the other developer

## Verification

The deployment has been verified to:

- ✅ Successfully connect to Redis
- ✅ Store and retrieve match data
- ✅ Support betting functionality

## Notes

- The application requires Vercel authentication to access, which provides an additional layer of security
- Both developers need to use the same wallet addresses and bet amount to properly test the functionality
- Redis connection is working correctly with the deployed application

## Troubleshooting

If you encounter any issues:

1. Verify both developers are using the correct match ID
2. Ensure your wallet addresses match the player addresses in the match
3. Check the Redis connection by running: `node scripts/verify-redis.js`
4. Verify match data with: `node scripts/connect-to-match.js https://headfinal-602ed02mn-jpatchings-projects.vercel.app`

## Future Deployments

To deploy new changes in the future:

1. Push changes to the repository
2. Run `.\deploy.ps1` to build and deploy to Vercel
3. Verify the deployment with the steps above
