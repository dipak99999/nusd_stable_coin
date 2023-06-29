const { expect } = require("chai");

describe("nUSDSmartContract", function () {
  let nUSD;
  let owner;
  let ethToUsdPrice;

  before(async function () {
    const nUSDContractFactory = await ethers.getContractFactory(
      "nUSDSmartContract"
    );
    nUSD = await nUSDContractFactory.deploy();
    await nUSD.deployed();

    owner = await ethers.getSigner(0);
    ethToUsdPrice = 2000; 
  });

  describe("Deposit", function () {
    it("should deposit ETH and mint corresponding nUSD tokens", async function () {
      const ethAmount = ethers.utils.parseEther("1"); // 1 ETH
      const nusdAmountExpected = ethAmount.mul(ethToUsdPrice).div(2);

      await nUSD.deposit({ value: ethAmount });

      const balance = await nUSD.balanceOf(owner.address);
      expect(balance).to.equal(nusdAmountExpected);
    });

    it("should update the total supply and decrease the available tokens", async function () {
      const ethAmount = ethers.utils.parseEther("1"); // 1 ETH

      const totalSupplyBefore = await nUSD.totalToken();
      await nUSD.deposit({ value: ethAmount });
      const totalSupplyAfter = await nUSD.totalToken();

      const expectedSupply = totalSupplyBefore.sub(
        ethAmount.mul(ethToUsdPrice).div(2)
      );
      expect(totalSupplyAfter).to.equal(expectedSupply);
    });

    it("should emit a Deposit event", async function () {
      const ethAmount = ethers.utils.parseEther("1"); // 1 ETH

      await expect(nUSD.deposit({ value: ethAmount }))
        .to.emit(nUSD, "Deposit")
        .withArgs(
          owner.address,
          ethAmount,
          ethAmount.mul(ethToUsdPrice).div(2)
        );
    });

    it("should revert if ETH amount is 0", async function () {
      await expect(nUSD.deposit({ value: 0 })).to.be.revertedWith(
        "ETH amount should be greater than 0"
      );
    });
  });

  describe("Redeem", function () {
    before(async function () {
      const ethAmount = ethers.utils.parseEther("1"); // 1 ETH
      await nUSD.deposit({ value: ethAmount });
    });

    it("should redeem nUSD tokens and transfer corresponding ETH", async function () {
      const nusdAmount = ethers.utils.parseUnits("1000", 18); // 1000 nUSD
      const ethAmountExpected = nusdAmount.mul(2).div(ethToUsdPrice);

      const balanceBefore = await ethers.provider.getBalance(owner.address);
      await nUSD.redeem(nusdAmount);
      const balanceAfter = await ethers.provider.getBalance(owner.address);

      expect(balanceAfter.sub(balanceBefore)).to.equal(ethAmountExpected);
    });

    it("should burn the redeemed nUSD tokens", async function () {
      const nusdAmount = ethers.utils.parseUnits("1000", 18); // 1000 nUSD

      const balanceBefore = await nUSD.balanceOf(owner.address);
      await nUSD.redeem(nusdAmount);
      const balanceAfter = await nUSD.balanceOf(owner.address);

      expect(balanceBefore.sub(balanceAfter)).to.equal(nusdAmount);
    });

    it("should revert if nUSD amount is 0", async function () {
      await expect(nUSD.redeem(0)).to.be.revertedWith(
        "nUSD amount should be greater than 0"
      );
    });
  });
});
