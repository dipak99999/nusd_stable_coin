// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract nUSDSmartContract is ERC20 {
    address public ETHToUSDAddress = 0x694AA1769357215DE4FAC081bf1f309aDC325306;
    AggregatorV3Interface internal priceFeed;
    uint public totalToken;

    event depositEvent (uint ethee, uint amount, int amount2);

    constructor() ERC20("nUSD", "nUSD") {
        priceFeed = AggregatorV3Interface(ETHToUSDAddress);
        totalToken = 100000;
    }

    function getLatestPrice() public view returns (int) {
        (
            /* uint80 roundID */,
            int price,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = priceFeed.latestRoundData();
        return price/1e8;
    }

    function deposit() external payable {
        require(msg.value > 0, "ETH amount should be greater than 0");

        uint256 ethAmount = msg.value;
        int256 ethToUsdPrice = getLatestPrice();
        uint256 usdValue = (uint256(ethAmount) * uint256(ethToUsdPrice))/1e18;
        uint256 nusdAmount = usdValue / 2;

        require(nusdAmount <= totalToken, "Total nUSD token limit exceeded");

        _mint(msg.sender, nusdAmount);
        totalToken = totalToken - nusdAmount;
        emit depositEvent(ethAmount, nusdAmount, ethToUsdPrice);
        emit Transfer(address(0), msg.sender, nusdAmount);
    }

    function redeem(uint256 nusdAmount) external {
        require(nusdAmount > 0, "nUSD amount should be greater than 0");
        require(balanceOf(msg.sender) >= nusdAmount, "Insufficient nUSD balance");

        uint256 ethAmount = nusdAmount * 2;
        int256 ethToUsdPrice = 1/getLatestPrice();
        uint256 usdValue = (ethAmount * uint256(ethToUsdPrice))* 1e18;

        require(usdValue <= address(this).balance, "Insufficient ETH balance for redemption");

        _burn(msg.sender, nusdAmount);
        (bool success, ) = msg.sender.call{value: ethAmount}("");
        require(success, "Failed to transfer ETH");
    }
}