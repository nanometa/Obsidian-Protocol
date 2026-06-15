import { expect } from "chai";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";

const SEVEN_DAYS = 7 * 24 * 60 * 60;
const FOURTEEN_DAYS = 14 * 24 * 60 * 60;

describe("ObsidianVault", function () {
  async function deployFixture() {
    const [owner, beneficiary, beneficiaryTwo, stranger] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("ObsidianVault");
    const vault = await factory.deploy();
    await vault.waitForDeployment();

    return { vault, owner, beneficiary, beneficiaryTwo, stranger };
  }

  it("creates a vault with an allowed timer and beneficiaries", async function () {
    const { vault, owner, beneficiary, beneficiaryTwo } = await deployFixture();

    await expect(
      vault.createVault(
        "bafy-encrypted-file",
        "-----BEGIN AGE ENCRYPTED PART A-----",
        "-----BEGIN AGE ENCRYPTED PART B-----",
        SEVEN_DAYS,
        [beneficiary.address, beneficiaryTwo.address]
      )
    )
      .to.emit(vault, "VaultCreated")
      .withArgs(owner.address, "bafy-encrypted-file", SEVEN_DAYS);

    const stored = await vault.getVault(owner.address);
    expect(stored.exists).to.equal(true);
    expect(stored.owner).to.equal(owner.address);
    expect(stored.ipfsHash).to.equal("bafy-encrypted-file");
    expect(stored.encryptedKeyPartA).to.equal("-----BEGIN AGE ENCRYPTED PART A-----");
    expect(stored.encryptedKeyPartB).to.equal("");
    expect(stored.timerDuration).to.equal(SEVEN_DAYS);
    expect(stored.beneficiaries).to.deep.equal([beneficiary.address, beneficiaryTwo.address]);
    expect(await vault.getStatus(owner.address)).to.equal(1);
  });

  it("rejects invalid timers and duplicate beneficiaries", async function () {
    const { vault, beneficiary } = await deployFixture();

    await expect(
      vault.createVault("bafy", "part-a", "part-b", 3 * 24 * 60 * 60, [beneficiary.address])
    ).to.be.revertedWithCustomError(vault, "InvalidTimer");

    await expect(
      vault.createVault("bafy", "part-a", "part-b", SEVEN_DAYS, [beneficiary.address, beneficiary.address])
    ).to.be.revertedWithCustomError(vault, "DuplicateBeneficiary");
  });

  it("allows only the owner to reset the heartbeat before expiry", async function () {
    const { vault, owner, beneficiary, stranger } = await deployFixture();
    await vault.createVault("bafy", "part-a", "part-b", FOURTEEN_DAYS, [beneficiary.address]);

    await time.increase(2 * 24 * 60 * 60);

    await expect(vault.connect(stranger).heartbeat()).to.be.revertedWithCustomError(vault, "VaultNotFound");

    const tx = await vault.connect(owner).heartbeat();
    const receipt = await tx.wait();
    const block = await ethers.provider.getBlock(receipt!.blockNumber);
    const expectedDeadline = BigInt(block!.timestamp + FOURTEEN_DAYS);

    await expect(tx).to.emit(vault, "HeartbeatSent").withArgs(owner.address, expectedDeadline);
    expect(await vault.nextDeadline(owner.address)).to.equal(expectedDeadline);
  });

  it("prevents heartbeat after expiry", async function () {
    const { vault, owner, beneficiary } = await deployFixture();
    await vault.createVault("bafy", "part-a", "part-b", SEVEN_DAYS, [beneficiary.address]);

    await time.increase(SEVEN_DAYS + 1);

    await expect(vault.connect(owner).heartbeat()).to.be.revertedWithCustomError(vault, "VaultExpired");
    expect(await vault.getStatus(owner.address)).to.equal(2);
  });

  it("lets anyone activate the trigger after expiry and permanently locks it", async function () {
    const { vault, owner, beneficiary, stranger } = await deployFixture();
    await vault.createVault("bafy", "encrypted-part-a", "encrypted-part-b", SEVEN_DAYS, [beneficiary.address]);

    await expect(vault.connect(stranger).activateTrigger(owner.address)).to.be.revertedWithCustomError(
      vault,
      "VaultStillActive"
    );

    await time.increase(SEVEN_DAYS + 1);

    await expect(vault.connect(stranger).activateTrigger(owner.address))
      .to.emit(vault, "TriggerActivated")
      .withArgs(owner.address, "bafy", "encrypted-part-a", "encrypted-part-b");

    expect(await vault.getStatus(owner.address)).to.equal(3);
    const stored = await vault.getVault(owner.address);
    expect(stored.encryptedKeyPartA).to.equal("encrypted-part-a");
    expect(stored.encryptedKeyPartB).to.equal("encrypted-part-b");
    await expect(vault.connect(owner).heartbeat()).to.be.revertedWithCustomError(vault, "VaultAlreadyTriggered");
    await expect(vault.connect(stranger).activateTrigger(owner.address)).to.be.revertedWithCustomError(
      vault,
      "VaultAlreadyTriggered"
    );
  });

  it("should hide keyPartB before trigger", async function () {
    const { vault, owner, beneficiary } = await deployFixture();
    await vault.createVault("bafy", "encrypted-part-a", "encrypted-part-b", SEVEN_DAYS, [beneficiary.address]);

    const stored = await vault.getVault(owner.address);
    expect(stored.encryptedKeyPartA).to.equal("encrypted-part-a");
    expect(stored.encryptedKeyPartB).to.equal("");
  });

  it("should reveal keyPartB after trigger", async function () {
    const { vault, owner, beneficiary, stranger } = await deployFixture();
    await vault.createVault("bafy", "encrypted-part-a", "encrypted-part-b", SEVEN_DAYS, [beneficiary.address]);

    await time.increase(SEVEN_DAYS + 1);
    await vault.connect(stranger).activateTrigger(owner.address);

    const stored = await vault.getVault(owner.address);
    expect(stored.encryptedKeyPartB).to.not.equal("");
    expect(stored.encryptedKeyPartB).to.equal("encrypted-part-b");
  });

  it("should return empty keyPartB when not triggered", async function () {
    const { vault, owner, beneficiary } = await deployFixture();
    await vault.createVault("bafy", "encrypted-part-a", "encrypted-part-b", SEVEN_DAYS, [beneficiary.address]);

    const stored = await vault.getVault(owner.address);
    expect(stored.triggered).to.equal(false);
    expect(stored.encryptedKeyPartB).to.equal("");
  });
});
