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
  const [loanAmount, setLoanAmount] = useState(2500000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [emi, setEmi] = useState(25000);
  const [savings, setSavings] = useState(30000);
  const [investmentReturn, setInvestmentReturn] = useState(12);
  const [inflationRate, setInflationRate] = useState(5);
  const [investmentHorizon, setInvestmentHorizon] = useState(15);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isFirstRun, setIsFirstRun] = useState(true);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError(null);

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
          label: 'Investment Value (EMI + Invest)',
          data: results.investmentValuesOption1,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          pointRadius: 0,
          borderWidth: 3,
        },
        {
          label: 'Investment Value (Invest After Payoff)',
          data: results.investmentValuesOption2,
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          pointRadius: 0,
          borderWidth: 3,
        },
        {
          label: 'Loan Outstanding (EMI + Invest)',
          data: results.loanOutstandingOption1,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          pointRadius: 0,
          borderWidth: 2,
          borderDash: [5, 5],
        },
        {
          label: 'Loan Outstanding (Invest After Payoff)',
          data: results.loanOutstandingOption2,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          pointRadius: 0,
          borderWidth: 2,
          borderDash: [5, 5],
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: '#667eea',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Months',
          font: {
            size: 14,
            weight: 'bold',
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Amount (₹)',
          font: {
            size: 14,
            weight: 'bold',
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value) {
            return '₹' + formatNumberIndian(value);
          },
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  return (
    <div className="container">
      <div className="header">
        <h1>💰 Debt vs Investment Calculator</h1>
        <p className="subtitle">
          Make smarter financial decisions by comparing two strategies: paying minimum EMI while investing, 
          or aggressively paying off debt before investing. Get personalized insights based on your financial situation.
        </p>
      </div>

      <div className="strategy-cards">
        <div className="strategy-card">
          <h3>🎯 EMI + Invest Strategy</h3>
          <p>Continue paying your regular EMI while investing the rest of your savings in the market. This approach leverages compound growth while maintaining debt payments.</p>
        </div>
        <div className="strategy-card">
          <h3>🚀 Debt-First Strategy</h3>
          <p>Use all available savings to pay off your loan as quickly as possible, then redirect those payments to investments. This eliminates interest burden first.</p>
        </div>
      </div>

      <div className="privacy-notice">
        <p>🔒 Your data is completely private - all calculations happen in your browser and nothing is stored on our servers.</p>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-section">
          <h3><span className="section-icon">💳</span>Loan Details</h3>
          
          <div className="form-group">
            <label className="input-label">
              Loan Amount: <span className="input-value">₹{formatNumberIndian(loanAmount)}</span>
            </label>
            <p className="input-description">Current outstanding loan balance that you owe to the bank</p>
            <div className="input-container">
              <input
                type="range"
                className="range-input"
                min="100000"
                max="10000000"
                step="1000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
              />
              <input
                type="number"
                className="number-input"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                placeholder="Enter loan amount"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">
              Interest Rate: <span className="input-value">{interestRate}%</span>
            </label>
            <p className="input-description">Annual interest rate charged by your lender</p>
            <div className="input-container">
              <input
                type="range"
                className="range-input"
                min="5"
                max="18"
                step="0.05"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
              />
              <input
                type="number"
                className="number-input"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="Enter interest rate"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">
              Monthly EMI: <span className="input-value">₹{formatNumberIndian(emi)}</span>
            </label>
            <p className="input-description">Minimum monthly payment required for your loan</p>
            <div className="input-container">
              <input
                type="range"
                className="range-input"
                min="5000"
                max="100000"
                step="250"
                value={emi}
                onChange={(e) => setEmi(e.target.value)}
              />
              <input
                type="number"
                className="number-input"
                value={emi}
                onChange={(e) => setEmi(e.target.value)}
                placeholder="Enter EMI amount"
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3><span className="section-icon">📈</span>Investment & Savings</h3>
          
          <div className="form-group">
            <label className="input-label">
              Monthly Savings: <span className="input-value">₹{formatNumberIndian(savings)}</span>
            </label>
            <p className="input-description">Amount you can save each month after all expenses (including EMI). <br/>
              • EMI + Invest: This savings is invested each month. After loan repayment, the full amount (EMI + this savings) is invested each month <br/>
              • Debt-First: This savings is used to pay off the loan. After loan repayment, the full amount (EMI + this savings) is invested each month.
            </p>
            <div className="input-container">
              <input
                type="range"
                className="range-input"
                min="5000"
                max="200000"
                step="250"
                value={savings}
                onChange={(e) => setSavings(e.target.value)}
              />
              <input
                type="number"
                className="number-input"
                value={savings}
                onChange={(e) => setSavings(e.target.value)}
                placeholder="Enter monthly savings"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">
              Expected Investment Return: <span className="input-value">{investmentReturn}%</span>
            </label>
            <p className="input-description">Annual return rate you expect from your investments (equity/mutual funds typically 10-15%)</p>
            <div className="input-container">
              <input
                type="range"
                className="range-input"
                min="6"
                max="25"
                step="0.05"
                value={investmentReturn}
                onChange={(e) => setInvestmentReturn(e.target.value)}
              />
              <input
                type="number"
                className="number-input"
                value={investmentReturn}
                onChange={(e) => setInvestmentReturn(e.target.value)}
                placeholder="Enter expected return"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">
              Savings Growth Rate: <span className="input-value">{inflationRate}%</span>
            </label>
            <p className="input-description">Annual rate at which your savings capacity increases (salary hikes, bonuses)</p>
            <div className="input-container">
              <input
                type="range"
                className="range-input"
                min="0"
                max="15"
                step="0.05"
                value={inflationRate}
                onChange={(e) => setInflationRate(e.target.value)}
              />
              <input
                type="number"
                className="number-input"
                value={inflationRate}
                onChange={(e) => setInflationRate(e.target.value)}
                placeholder="Enter growth rate"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">
              Investment Horizon: <span className="input-value">{investmentHorizon} years</span>
            </label>
            <p className="input-description">Time period for your financial planning and wealth building goals</p>
            <div className="input-container">
              <input
                type="range"
                className="range-input"
                min="5"
                max="30"
                step="1"
                value={investmentHorizon}
                onChange={(e) => setInvestmentHorizon(e.target.value)}
              />
              <input
                type="number"
                className="number-input"
                value={investmentHorizon}
                onChange={(e) => setInvestmentHorizon(e.target.value)}
                placeholder="Enter time horizon"
                required
              />
            </div>
          </div>
        </div>

        <div className="button-container">
          <button type="submit" className="submit-button">
            {isFirstRun ? '🚀 Calculate & Compare' : '🔄 Recalculate'}
          </button>
        </div>
      </form>

      {error && <div className="error">⚠️ {error}</div>}

      {results && (
        <div className="results">
          <div className="results-header">
            <h2>📊 Financial Strategy Comparison</h2>
            <p className="results-description">
              Here's how the two strategies perform based on your inputs. The table below shows key metrics 
              to help you make an informed decision about your financial future.
            </p>
          </div>

          <table className="comparison-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>🎯 EMI + Invest</th>
                <th>🚀 Debt-First</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td data-label="Metric">Total Interest Paid to Bank</td>
                <td data-label="EMI + Invest">₹{formatNumberIndian(results.totalInterestPaidOption1.toFixed(0))}</td>
                <td data-label="Debt-First">₹{formatNumberIndian(results.totalInterestPaidOption2.toFixed(0))}</td>
              </tr>
              <tr>
                <td data-label="Metric">Months to Become Debt-Free</td>
                <td data-label="EMI + Invest">
                  {results.monthsToRepayLoanOption1 > investmentHorizon * 12
                    ? "⚠️ Loan won't be cleared in given timeframe"
                    : `${results.monthsToRepayLoanOption1} months`}
                </td>
                <td data-label="Debt-First">
                  {results.monthsToRepayLoanOption2 > investmentHorizon * 12
                    ? "⚠️ Loan won't be cleared in given timeframe"
                    : `${results.monthsToRepayLoanOption2} months`}
                </td>
              </tr>
              <tr>
                <td data-label="Metric">Total Wealth After {investmentHorizon} Years</td>
                <td data-label="EMI + Invest">₹{formatNumberIndian(results.futureValueInvestmentOption1.toFixed(0))}</td>
                <td data-label="Debt-First">₹{formatNumberIndian(results.futureValueInvestmentOption2.toFixed(0))}</td>
              </tr>
              <tr>
                <td data-label="Metric"><strong>Net Advantage</strong></td>
                <td data-label="EMI + Invest">
                  {results.futureValueInvestmentOption1 > results.futureValueInvestmentOption2 
                    ? `✅ Better by ₹${formatNumberIndian((results.futureValueInvestmentOption1 - results.futureValueInvestmentOption2).toFixed(0))}`
                    : `❌ Lower by ₹${formatNumberIndian((results.futureValueInvestmentOption2 - results.futureValueInvestmentOption1).toFixed(0))}`}
                </td>
                <td data-label="Debt-First">
                  {results.futureValueInvestmentOption2 > results.futureValueInvestmentOption1 
                    ? `✅ Better by ₹${formatNumberIndian((results.futureValueInvestmentOption2 - results.futureValueInvestmentOption1).toFixed(0))}`
                    : `❌ Lower by ₹${formatNumberIndian((results.futureValueInvestmentOption1 - results.futureValueInvestmentOption2).toFixed(0))}`}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="chart-container">
            <div className="chart">
              <Line data={createChartData()} options={chartOptions} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calculator;