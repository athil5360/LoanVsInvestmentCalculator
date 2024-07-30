import React, { useState } from 'react';
import './Calculator.css';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

const formatNumberIndian = (number) => {
  return new Intl.NumberFormat('en-IN').format(number);
};
/*
const formatMonthsToYearsAndMonths = (months) => {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return `${years} years and ${remainingMonths} months`;
};*/
const removeLeadingZeroes = (value) => {
  return value.replace(/^0+/, '') || '0';
};
const isValidNumber = (value) => {
  return !isNaN(value) && value.trim() !== '';
};


ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const calculateFinancialScenarios = (data) => {
  // Validate input data
  const requiredKeys = ['loanAmount', 'interestRate', 'emi', 'savings', 'investmentReturn', 'inflationRate', 'investmentHorizon'];
  for (const key of requiredKeys) {
    if (!(key in data)) {
      throw new Error(`Missing required field: ${key}`);
    }
  }

  const loanAmount = parseFloat(data.loanAmount);
  const interestRate = parseFloat(data.interestRate) / 100 / 12; // Convert annual rate to monthly
  const minimumEmi = parseFloat(data.emi);
  let monthlySavings = parseFloat(data.savings)+minimumEmi
  const annualSavingsIncreaseRate = parseFloat(data.inflationRate) / 100;
  const equityReturnRate = parseFloat(data.investmentReturn) / 100 / 12; // Convert annual rate to monthly
  const years = parseInt(data.investmentHorizon);
  const months = years * 12;

  // Arrays to store results
  const scenario1 = [];
  const scenario2 = [];

  // Initial Values
  let loanOutstanding = loanAmount;
  let totalInvestmentValue1 = 0;
  let totalInvestmentValue2 = 0;
  let totalInterestPaid1 = 0;
  let totalInterestPaid2 = 0;
  let monthsToRepayLoan1 = Infinity;
  let monthsToRepayLoan2 = Infinity;

  // Scenario 1: Pay minimum EMI and invest remaining savings in equity
  for (let month = 1; month <= months; month++) {
    let interestPayment, principalPayment, amountInvested;

    if (loanOutstanding > 0) {
      interestPayment = loanOutstanding * interestRate;
      principalPayment = minimumEmi - interestPayment;

      // Adjust for loan payoff
      if (principalPayment > loanOutstanding) {
        principalPayment = loanOutstanding;
        amountInvested = monthlySavings - interestPayment - principalPayment;
        loanOutstanding = 0;
        monthsToRepayLoan1 = month;
      } else {
        loanOutstanding -= principalPayment;
        amountInvested = monthlySavings - minimumEmi;
      }
    } else {
      interestPayment = 0;
      principalPayment = 0;
      amountInvested = monthlySavings;
    }

    totalInterestPaid1 += interestPayment;
    totalInvestmentValue1 = (totalInvestmentValue1) * (1 + equityReturnRate) + amountInvested;

    // Save to array
    scenario1.push({
      Month: month,
      LoanOutstanding: Math.max(loanOutstanding, 0),
      InterestPaid: interestPayment,
      PrincipalPaid: principalPayment,
      AmountInvested: amountInvested,
      TotalInvestmentValue: totalInvestmentValue1
    });

    // Increase savings annually
    if (month % 12 === 0) {
      monthlySavings *= (1 + annualSavingsIncreaseRate);
    }
  }

  // Reset savings for scenario 2
  monthlySavings = parseFloat(data.savings)+minimumEmi;

  // Scenario 2: Pay entire savings to loan repayment, then invest in equity
  loanOutstanding = loanAmount;
  for (let month = 1; month <= months; month++) {
    let interestPayment, principalPayment, amountInvested;

    if (loanOutstanding > 0) {
      interestPayment = loanOutstanding * interestRate;
      principalPayment = monthlySavings - interestPayment;

      // Adjust for loan payoff
      if (principalPayment > loanOutstanding) {
        principalPayment = loanOutstanding;
        amountInvested = monthlySavings - interestPayment - principalPayment;
        loanOutstanding = 0;
        monthsToRepayLoan2 = month;
      } else {
        loanOutstanding -= principalPayment;
        amountInvested = 0;
      }

      totalInterestPaid2 += interestPayment;
    } else {
      interestPayment = 0;
      principalPayment = 0;
      amountInvested = monthlySavings;
    }

    // Investing remaining savings in equity after loan repayment
    totalInvestmentValue2 = (totalInvestmentValue2) * (1 + equityReturnRate) + amountInvested;

    // Save to array
    scenario2.push({
      Month: month,
      LoanOutstanding: Math.max(loanOutstanding, 0),
      InterestPaid: interestPayment,
      PrincipalPaid: principalPayment,
      AmountInvested: amountInvested,
      TotalInvestmentValue: totalInvestmentValue2
    });

    // Increase savings annually
    if (month % 12 === 0) {
      monthlySavings *= (1 + annualSavingsIncreaseRate);
    }
  }

  // Final Results
  const totalInvestmentValue1Final = scenario1[scenario1.length - 1].TotalInvestmentValue;
  const totalInvestmentValue2Final = scenario2[scenario2.length - 1].TotalInvestmentValue;

  return {
    totalInterestPaidOption1: totalInterestPaid1,
    totalInterestPaidOption2: totalInterestPaid2,
    futureValueInvestmentOption1: totalInvestmentValue1Final,
    futureValueInvestmentOption2: totalInvestmentValue2Final,
    monthsToRepayLoanOption1: monthsToRepayLoan1,
    monthsToRepayLoanOption2: monthsToRepayLoan2,
    investmentValuesOption1: scenario1.map(item => item.TotalInvestmentValue),
    investmentValuesOption2: scenario2.map(item => item.TotalInvestmentValue),
    loanOutstandingOption1: scenario1.map(item => item.LoanOutstanding),
    loanOutstandingOption2: scenario2.map(item => item.LoanOutstanding)
  };
};

function Calculator() {
  const [loanAmount, setLoanAmount] = useState(null); // default value
  const [interestRate, setInterestRate] = useState(null); // default value
  const [emi, setEmi] = useState(null); // default value
  const [savings, setSavings] = useState(null); // default value
  const [investmentReturn, setInvestmentReturn] = useState(null); // default value
  const [inflationRate, setInflationRate] = useState(null); // default value
  const [investmentHorizon, setInvestmentHorizon] = useState(null); // default value
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isFirstRun, setIsFirstRun] = useState(true);

  
  const handleSubmit = (event) => {
    event.preventDefault();
    setError(null); // Reset error state

    try {
      const data = calculateFinancialScenarios({
        loanAmount,
        interestRate,
        emi,
        savings,
        investmentReturn,
        inflationRate,
        investmentHorizon
      });
      setResults(data);
      setIsFirstRun(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const createChartData = () => {
    if (!results) return null;

    const allValues = [
      ...results.investmentValuesOption1,
      ...results.investmentValuesOption2,
      ...results.loanOutstandingOption1,
      ...results.loanOutstandingOption2
    ];
    const minYValue = Math.min(...allValues);
    const maxYValue = Math.max(...allValues);

    return {
      labels: Array.from({ length: investmentHorizon * 12 }, (_, i) => i + 1),
      datasets: [
        {
          label: 'Total Investment (EMI and Invest)',
          data: results.investmentValuesOption1,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          pointRadius: 0,
        },
        {
          label: 'Total Investment (Invest After Loan Payoff)',
          data: results.investmentValuesOption2,
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          pointRadius: 0,
        },
        {
          label: 'Loan Outstanding (EMI and Invest)',
          data: results.loanOutstandingOption1,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          pointRadius: 0,
        },
        {
          label: 'Loan Outstanding (Invest After Loan Payoff)',
          data: results.loanOutstandingOption2,
          borderColor: 'rgba(255, 159, 64, 1)',
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
          pointRadius: 0,
        },
      ],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: minYValue,
            max: maxYValue,
          },
        },
      },
    };
  };

  return (
    <div className="container">
      <h1>Paying Off Debt vs. Investing?</h1>
      <p>I was confused about whether to prioritize repaying my loan quickly or to start investing right away. To make an informed decision, I evaluated the potential outcomes of two different strategies:</p>
      <p><b>
        EMI and Invest:</b> Continue paying your regular EMI while investing the rest of your savings.</p>
      <p><b>
        Invest After Loan Payoff:</b> Use all your monthly savings to pay off your loan as quickly as possible, and then start investing.
      </p>
        <p>
        Sharing the tool here. Enter your loan details, savings, and other relevant financial information to see how these two strategies compare for you. 
      </p>
      <p>
    <i>
        Rest assured, your data is not stored anywhere. The calculations are done entirely in your browser, ensuring complete privacy.
      </i></p>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-side">
          <div className="form-group">
            <label htmlFor="loanAmount">
              Loan Amount: ₹{formatNumberIndian(loanAmount)}
              </label>
              <span className="description">How much you owe to your bank as of now</span>
            <input
              type="range"
              id="loanAmount"
              min="0"
              max="10000000"
              step="10000"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              required
            />
            <input
              type="number"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              placeholder="Enter Loan Amount"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="interestRate">
              Interest Rate (%): {interestRate}
              </label>
              <span className="description">The scary percentage that makes us avoid looking at our loan statement</span>
            <input
              type="range"
              id="interestRate"
              min="0"
              max="15"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              required
            />
            <input
              type="number"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              placeholder="Enter Interest Rate"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="emi">
              EMI: ₹{formatNumberIndian(emi)}
            </label>
              <span className="description">The minimum amount you need to pay as EMI towards your loan</span>
            <input
              type="range"
              id="emi"
              min="0"
              max="50000"
              step="250"
              value={emi}
              onChange={(e) => setEmi(e.target.value)}
              required
            />
            <input
              type="number"
              value={emi}
              onChange={(e) => setEmi(e.target.value)}
              placeholder="Enter Minimum EMI"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="savings">
              Monthly Savings: ₹{formatNumberIndian(savings)}
              </label>
              <span className="description">What's your expected savings after all expenses including emi</span>
            <input
              type="range"
              id="savings"
              min="0"
              max="150000"
              step="500"
              value={savings}
              onChange={(e) => setSavings(e.target.value)}
              required
            />
            <input
              type="number"
              value={savings}
              onChange={(e) => setSavings(e.target.value)}
              placeholder="Enter Monthly Savings"
              required
            />
          </div>
        </div>
        <div className="form-side">
          <div className="form-group">
            <label htmlFor="investmentReturn">
              Investment Return Rate (%): {investmentReturn}
              </label>
              <span className="description">The expected rate of return from your investment.</span>
            <input
              type="range"
              id="investmentReturn"
              min="0"
              max="50"
              step="0.1"
              value={investmentReturn}
              onChange={(e) => setInvestmentReturn(e.target.value)}
              required
            />
            <input
              type="number"
              value={investmentReturn}
              onChange={(e) => setInvestmentReturn(e.target.value)}
              placeholder="Enter Investment Return Rate"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="inflationRate">
              Savings growth rate (%): {inflationRate}
              </label>
              <span className="description">The rate at which your savings is expected to increase annually. If it doesn’t, just put 0; thanks to our tiny appraisals.</span>
            <input
              type="range"
              id="inflationRate"
              min="0"
              max="10"
              step="0.1"
              value={inflationRate}
              onChange={(e) => setInflationRate(e.target.value)}
              required
            />
            <input
              type="number"
              value={inflationRate}
              onChange={(e) => setInflationRate(e.target.value)}
              placeholder="Enter Savings Growth Rate"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="investmentHorizon">
              Investment Horizon (Years): {investmentHorizon}
              </label>
              <span className="description">When you’re going to look at all the money you have and say, "Enough!"</span>
            <input
              type="range"
              id="investmentHorizon"
              min="0"
              max="30"
              step="1"
              value={investmentHorizon}
              onChange={(e) => setInvestmentHorizon(e.target.value)}
              required
            />
            <input
              type="number"
              value={investmentHorizon}
              onChange={(e) => setInvestmentHorizon(e.target.value)}
              placeholder="Enter Investment Horizon"
              required
            />
          </div>
        </div>
        <button type="submit" className="submit-button">
          {isFirstRun ? 'Calculate' : 'Refresh'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {results && (
        <div className="results">
          <h2>Results</h2>
          <p>Here is the calculation for the two scenarios based on your inputs</p>
          <p><b>
            EMI and Invest:</b> Continue paying your regular EMI while investing the rest of your savings.</p>
          <p><b>
            Invest After Loan Payoff:</b> Use all your monthly savings to pay off your loan as quickly as possible, and then start investing.
          </p>

          <table className="comparison-table">
            <thead>
              <tr>
                <th></th>
                <th>EMI and Invest</th>
                <th> Invest After Loan Payoff</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td data-label="">Total interest gifted to your bank</td>
                <td data-label="EMI and Invest">₹{formatNumberIndian(results.totalInterestPaidOption1.toFixed(2))}</td>
                <td data-label="Invest After Loan Payoff">₹{formatNumberIndian(results.totalInterestPaidOption2.toFixed(2))}</td>
              </tr>
              <tr>
                <td>Month when you’ll be Debt-Free</td>
                <td data-label="EMI and Invest">
                  {results.monthsToRepayLoanOption1 > investmentHorizon * 12
                    ? "You can't close the loan within the given horizon. Time to rethink those financial strategies!"
                    : `${results.monthsToRepayLoanOption1}`}
                </td>
                <td data-label="Invest After Loan Payoff">
                  {results.monthsToRepayLoanOption2 > investmentHorizon * 12
                    ? "You can't close the loan within the given horizon. Time to rethink those financial strategies!"
                    : `${results.monthsToRepayLoanOption2}`}
                </td>
              </tr>
              <tr>
                <td>Total cash pile after the given investment horizon</td>
                <td data-label="EMI and Invest">₹{formatNumberIndian(results.futureValueInvestmentOption1.toFixed(2))}</td>
                <td data-label="Invest After Loan Payoff">₹{formatNumberIndian(results.futureValueInvestmentOption2.toFixed(2))}</td>
              </tr>
            </tbody>
          </table>

          <div className="chart">
            <Line data={createChartData()} options={createChartData().options} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Calculator;
