import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Pv3Program } from "../target/types/pv3_program";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("pv3", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Pv3Program as Program<Pv3Program>;
  
  // Test accounts
  const adminKeypair1 = Keypair.generate();
  const adminKeypair2 = Keypair.generate();
  const adminKeypair3 = Keypair.generate();
  const platformFeeKeypair = Keypair.generate();
  const verifierKeypair = Keypair.generate();
  
  // PDAs
  let adminConfigPDA: PublicKey;
  let verifierConfigPDA: PublicKey;
  let matchPDA: PublicKey;
  
  before(async () => {
    // Airdrop SOL to admin keypairs
    await provider.connection.requestAirdrop(adminKeypair1.publicKey, 2e9);
    await provider.connection.requestAirdrop(adminKeypair2.publicKey, 2e9);
    await provider.connection.requestAirdrop(adminKeypair3.publicKey, 2e9);
    
    // Find PDAs
    [adminConfigPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("admin_config")],
      program.programId
    );
    
    [verifierConfigPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("verifier_config")],
      program.programId
    );
  });

  it("Initializes admin configuration", async () => {
    await program.methods
      .initializeAdmin(
        [
          adminKeypair1.publicKey,
          adminKeypair2.publicKey,
          adminKeypair3.publicKey,
        ],
        platformFeeKeypair.publicKey
      )
      .accounts({
        authority: provider.wallet.publicKey,
        adminConfig: adminConfigPDA,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const adminConfig = await program.account.adminConfig.fetch(adminConfigPDA);
    expect(adminConfig.signers).to.deep.equal([
      adminKeypair1.publicKey,
      adminKeypair2.publicKey,
      adminKeypair3.publicKey,
    ]);
    expect(adminConfig.platformFeeAccount.equals(platformFeeKeypair.publicKey)).to.be.true;
    expect(adminConfig.minSignatures).to.equal(2);
  });

  it("Initializes verifier configuration", async () => {
    await program.methods
      .initializeVerifier(verifierKeypair.publicKey, adminConfigPDA)
      .accounts({
        authority: provider.wallet.publicKey,
        verifierConfig: verifierConfigPDA,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const verifierConfig = await program.account.verifierConfig.fetch(verifierConfigPDA);
    expect(verifierConfig.verifierPubkey.equals(verifierKeypair.publicKey)).to.be.true;
    expect(verifierConfig.adminConfig.equals(adminConfigPDA)).to.be.true;
    expect(verifierConfig.isActive).to.be.true;
  });

  it("Creates a match", async () => {
    const creator = Keypair.generate();
    await provider.connection.requestAirdrop(creator.publicKey, 2e9);
    
    [matchPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("match"), creator.publicKey.toBuffer()],
      program.programId
    );

    const wagerAmount = new anchor.BN(1e9); // 1 SOL
    const expiry = new anchor.BN(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now

    await program.methods
      .createMatch(wagerAmount, "test_game", expiry)
      .accounts({
        creator: creator.publicKey,
        matchAccount: matchPDA,
        adminConfig: adminConfigPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    const matchAccount = await program.account.matchAccount.fetch(matchPDA);
    expect(matchAccount.creator.equals(creator.publicKey)).to.be.true;
    expect(matchAccount.wagerAmount.eq(wagerAmount)).to.be.true;
    expect(matchAccount.gameId).to.equal("test_game");
    expect(matchAccount.state).to.deep.equal({ created: {} });
  });

  it("Joins a match", async () => {
    const joiner = Keypair.generate();
    await provider.connection.requestAirdrop(joiner.publicKey, 2e9);

    await program.methods
      .joinMatch()
      .accounts({
        joiner: joiner.publicKey,
        matchAccount: matchPDA,
        adminConfig: adminConfigPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([joiner])
      .rpc();

    const matchAccount = await program.account.matchAccount.fetch(matchPDA);
    expect(matchAccount.joiner.equals(joiner.publicKey)).to.be.true;
    expect(matchAccount.state).to.deep.equal({ inProgress: {} });
  });

  it("Submits match result", async () => {
    // Create signature
    const matchAccount = await program.account.matchAccount.fetch(matchPDA);
    const winner = matchAccount.creator;
    const timestamp = Math.floor(Date.now() / 1000);
    
    const message = Buffer.concat([
      matchPDA.toBuffer(),
      winner.toBuffer(),
      Buffer.from(new anchor.BN(timestamp).toArray("le", 8))
    ]);
    
    const signature = verifierKeypair.sign(message);

    await program.methods
      .submitResult(winner, signature)
      .accounts({
        matchAccount: matchPDA,
        verifierConfig: verifierConfigPDA,
        adminConfig: adminConfigPDA,
        winner,
        platformFeeAccount: platformFeeKeypair.publicKey,
        verifySignature: anchor.web3.Ed25519Program.programId,
      })
      .rpc();

    const updatedMatch = await program.account.matchAccount.fetch(matchPDA);
    expect(updatedMatch.state).to.deep.equal({ completed: {} });
    expect(updatedMatch.winner.equals(winner)).to.be.true;
  });

  it("Executes emergency action", async () => {
    await program.methods
      .executeEmergencyAction({ pauseMatches: {} })
      .accounts({
        adminConfig: adminConfigPDA,
        signer1: adminKeypair1.publicKey,
        signer2: adminKeypair2.publicKey,
        targetAccount: adminConfigPDA,
      })
      .signers([adminKeypair1, adminKeypair2])
      .rpc();

    const adminConfig = await program.account.adminConfig.fetch(adminConfigPDA);
    expect(adminConfig.isPaused).to.be.true;
  });
}); 