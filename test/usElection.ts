import { USElection } from "./../typechain-types/Election.sol/USElection";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
describe("USElection", function () {
  let usElectionFactory;
  let usElection: USElection;

  let owner: Signer;
  let caller: Signer;

  before(async () => {
    [owner, caller] = await ethers.getSigners();
    usElectionFactory = await ethers.getContractFactory("USElection", owner);

    usElection = await usElectionFactory.deploy();

    await usElection.deployed();
  });

  const createStateResults = (
    _name: string,
    _votesBiden: number,
    _votesTrump: number,
    _stateSeats: number
  ) =>
    ({
      name: _name,
      votesBiden: _votesBiden,
      votesTrump: _votesTrump,
      stateSeats: _stateSeats,
    } as USElection.StateResultStruct);

  it("Should return the current leader before submit any election results", async function () {
    expect(await usElection.currentLeader()).to.equal(0); // NOBODY
  });

  it("Should return the election status", async function () {
    expect(await usElection.electionEnded()).to.equal(false); // Not Ended
  });

  it("Should submit state results and get current leader", async function () {
    const stateResults = createStateResults("California", 1000, 900, 32);

    const submitStateResultsTx = await usElection.submitStateResult(
      stateResults
    );

    await submitStateResultsTx.wait();

    expect(await usElection.currentLeader()).to.equal(1); // BIDEN
  });

  it("Should throw when try to submit already submitted state results", async function () {
    const stateResults = createStateResults("California", 1000, 900, 32);

    expect(usElection.submitStateResult(stateResults)).to.be.revertedWith(
      "This state result was already submitted!"
    );
  });

  it("Should throw when try to submit 0 seats", async function () {
    const stateResults = createStateResults("Ohaio", 800, 1200, 0);
    await expect(usElection.submitStateResult(stateResults)).revertedWith(
      "States must have at least 1 seat"
    );
  });

  it("Should throw when try to submit equal votes", async function () {
    const stateResults = createStateResults("Ohaio", 800, 800, 1);

    await expect(usElection.submitStateResult(stateResults)).revertedWith(
      "There cannot be a tie"
    );
  });

  it("Should submit state results and get current leader", async function () {
    const stateResults = createStateResults("Ohaio", 800, 1200, 33);

    const submitStateResultsTx = await usElection.submitStateResult(
      stateResults
    );

    await submitStateResultsTx.wait();

    expect(await usElection.currentLeader()).to.equal(2); // TRUMP
  });

  it("Should end the elections, get the leader and election status", async function () {
    const endElectionTx = await usElection.endElection();

    await endElectionTx.wait();

    expect(await usElection.currentLeader()).to.equal(2); // TRUMP

    expect(await usElection.electionEnded()).to.equal(true); // Ended
  });

  //TODO: ADD YOUR TESTS
  //NOTE: Election is ended after the previous test

  it("Should throw when not an owner try to submit state results", async function () {
    const stateResults = createStateResults("California", 1000, 900, 32);

    await expect(
      usElection.connect(caller).submitStateResult(stateResults)
    ).to.be.revertedWith("Not invoked by the owner");
  });

  it("Should throw when not an owner try to end election", async function () {
    await expect(usElection.connect(caller).endElection()).to.be.revertedWith(
      "Not invoked by the owner"
    );
  });

  it("Should throw 'The election has ended already' when try to submit state results", async function () {
    const stateResults = createStateResults("California", 1000, 900, 32);

    await expect(usElection.submitStateResult(stateResults)).to.be.revertedWith(
      "The election has ended already"
    );
  });

  it("Should throw 'The election has ended already' when try to end election", async function () {
    await expect(usElection.endElection()).to.be.revertedWith(
      "The election has ended already"
    );
  });
});
