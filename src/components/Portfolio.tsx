import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import SubscriptionModal from './SubscriptionModal';

interface Coin {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
}

interface PortfolioHolding {
  coinId: string;
  symbol: string;
  name: string;
  quantity: number;
  buyPrice: number;
  image: string;
}

const Portfolio = () => {
  const [activeTab, setActiveTab] = useState<'market' | 'portfolio'>('market');
  const [coins, setCoins] = useState<Coin[]>([]);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [selectedHolding, setSelectedHolding] = useState<PortfolioHolding | null>(null);
  const [buyQuantity, setBuyQuantity] = useState('');
  const [sellQuantity, setSellQuantity] = useState('');
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [selectedStats, setSelectedStats] = useState<PortfolioHolding | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const { user, incrementTransactionCount } = useAuth();

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false'
      );
      const data = await response.json();
      setCoins(data);
    } catch (err) {
      setError('Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = (coin: Coin) => {
    if (!user?.isSubscribed && (user?.transactionCount ?? 0) >= 3) {
      setShowSubscriptionModal(true);
      return;
    }
    setSelectedCoin(coin);
    setBuyModalOpen(true);
  };

  const handleSell = (holding: PortfolioHolding) => {
    if (!user?.isSubscribed && (user?.transactionCount ?? 0) >= 3) {
      setShowSubscriptionModal(true);
      return;
    }
    const currentCoin = coins.find(c => c.id === holding.coinId);
    if (currentCoin) {
      setSelectedHolding(holding);
      setSelectedCoin(currentCoin);
      setSellModalOpen(true);
    }
  };

  const executeBuy = () => {
    if (!selectedCoin || !buyQuantity) return;

    const quantity = parseFloat(buyQuantity);
    if (isNaN(quantity) || quantity <= 0) return;

    // Check if user already owns this coin
    const existingHolding = holdings.find(h => h.coinId === selectedCoin.id);

    if (existingHolding) {
      // Update existing holding
      const updatedHoldings = holdings.map(h => {
        if (h.coinId === selectedCoin.id) {
          const newQuantity = h.quantity + quantity;
          const totalCost = (h.quantity * h.buyPrice) + (quantity * selectedCoin.current_price);
          const averageBuyPrice = totalCost / newQuantity;
          
          return {
            ...h,
            quantity: newQuantity,
            buyPrice: averageBuyPrice
          };
        }
        return h;
      });
      setHoldings(updatedHoldings);
    } else {
      // Create new holding
      const newHolding: PortfolioHolding = {
        coinId: selectedCoin.id,
        symbol: selectedCoin.symbol,
        name: selectedCoin.name,
        quantity: quantity,
        buyPrice: selectedCoin.current_price,
        image: selectedCoin.image
      };
      setHoldings(prev => [...prev, newHolding]);
    }

    incrementTransactionCount();
    setBuyModalOpen(false);
    setBuyQuantity('');
    setSelectedCoin(null);
  };

  const executeSell = () => {
    if (!selectedHolding || !selectedCoin || !sellQuantity) return;

    const quantity = parseFloat(sellQuantity);
    if (isNaN(quantity) || quantity <= 0 || quantity > selectedHolding.quantity) return;

    if (quantity === selectedHolding.quantity) {
      setHoldings(prev => prev.filter(h => h !== selectedHolding));
    } else {
      setHoldings(prev =>
        prev.map(h =>
          h === selectedHolding
            ? { ...h, quantity: h.quantity - quantity }
            : h
        )
      );
    }

    incrementTransactionCount();
    setSellModalOpen(false);
    setSellQuantity('');
    setSelectedHolding(null);
    setSelectedCoin(null);
  };

  const calculateTotalValue = () => {
    return holdings.reduce((total, holding) => {
      const currentCoin = coins.find(c => c.id === holding.coinId);
      const currentPrice = currentCoin ? currentCoin.current_price : holding.buyPrice;
      return total + (holding.quantity * currentPrice);
    }, 0);
  };

  const calculatePortfolioStats = () => {
    if (holdings.length === 0) return null;

    const stats = holdings.reduce((acc, holding) => {
      const currentCoin = coins.find(c => c.id === holding.coinId);
      const currentPrice = currentCoin ? currentCoin.current_price : holding.buyPrice;
      const currentValue = holding.quantity * currentPrice;
      const investedAmount = holding.quantity * holding.buyPrice;

      return {
        currentValue: acc.currentValue + currentValue,
        invested: acc.invested + investedAmount,
      };
    }, { currentValue: 0, invested: 0 });

    const totalReturns = stats.currentValue - stats.invested;
    const totalReturnsPercentage = ((totalReturns / stats.invested) * 100);

    return {
      ...stats,
      totalReturns,
      totalReturnsPercentage,
    };
  };

  const handleShowStats = (holding: PortfolioHolding) => {
    setSelectedStats(holding);
    setStatsModalOpen(true);
  };

  const portfolioValue = calculateTotalValue();

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <div className="bg-app-primary-light dark:bg-app-primary-dark rounded-lg shadow-lg overflow-hidden">
        <div className="flex justify-center border-b border-app-secondary-light dark:border-app-secondary-dark">
          <div className="flex space-x-1 p-2">
            <button
              className={`px-8 py-3 rounded-md transition-colors duration-200 font-medium ${
                activeTab === 'market'
                  ? 'bg-app-accent text-white'
                  : 'text-app-text-light dark:text-app-text-dark hover:bg-app-accent/10'
              }`}
              onClick={() => setActiveTab('market')}
            >
              Market
            </button>
            <button
              className={`px-8 py-3 rounded-md transition-colors duration-200 font-medium ${
                activeTab === 'portfolio'
                  ? 'bg-app-accent text-white'
                  : 'text-app-text-light dark:text-app-text-dark hover:bg-app-accent/10'
              }`}
              onClick={() => setActiveTab('portfolio')}
            >
              Portfolio
            </button>
          </div>
        </div>

        <div className="p-6 border-b border-app-secondary-light dark:border-app-secondary-dark">
          <div className="flex flex-col space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-app-text-light dark:text-app-text-dark">
                Welcome, {user?.name}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {activeTab === 'market' 
                  ? 'Explore and buy from available cryptocurrencies'
                  : 'View and manage your crypto holdings'}
              </p>
            </div>

            {holdings.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Current Value */}
                <div className="bg-app-secondary-light dark:bg-app-secondary-dark rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Value</h3>
                  <p className="text-xl font-bold text-app-text-light dark:text-app-text-dark mt-1">
                    ${portfolioValue.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    The value of your portfolio based on the current market price of each coin.
                  </p>
                </div>

                {/* Invested */}
                <div className="bg-app-secondary-light dark:bg-app-secondary-dark rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Invested</h3>
                  <p className="text-xl font-bold text-app-text-light dark:text-app-text-dark mt-1">
                    ${calculatePortfolioStats()?.invested?.toLocaleString() ?? '0'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    The total amount invested by you in all coins that you currently hold.
                  </p>
                </div>

                {/* Total Returns */}
                <div className="bg-app-secondary-light dark:bg-app-secondary-dark rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Returns</h3>
                  <div className="flex items-baseline gap-2">
                    <p className={`text-xl font-bold ${
                      (calculatePortfolioStats()?.totalReturns ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'
                    } mt-1`}>
                      ${Math.abs(calculatePortfolioStats()?.totalReturns ?? 0).toLocaleString()}
                    </p>
                    <p className={`text-sm ${
                      (calculatePortfolioStats()?.totalReturns ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      ({(calculatePortfolioStats()?.totalReturnsPercentage ?? 0).toFixed(2)}%)
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    The total profit/loss for all coins that you currently hold.
                  </p>
                </div>

                {/* Total Returns % */}
                <div className="bg-app-secondary-light dark:bg-app-secondary-dark rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Returns %</h3>
                  <p className={`text-xl font-bold ${
                    (calculatePortfolioStats()?.totalReturnsPercentage ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'
                  } mt-1`}>
                    {(calculatePortfolioStats()?.totalReturnsPercentage ?? 0).toFixed(2)}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    The total profit/loss in percentage for all coins that you currently hold.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center p-8 text-app-text-light dark:text-app-text-dark">Loading...</div>
        ) : error ? (
          <div className="text-red-500 text-center p-8">{error}</div>
        ) : (
          <div className="p-6">
            {activeTab === 'market' ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-app-secondary-light dark:border-app-secondary-dark">
                      <th className="text-left p-4 text-app-text-light dark:text-app-text-dark font-medium">Coin</th>
                      <th className="text-left p-4 text-app-text-light dark:text-app-text-dark font-medium">Price</th>
                      <th className="text-left p-4 text-app-text-light dark:text-app-text-dark font-medium">24h Change</th>
                      <th className="text-left p-4 text-app-text-light dark:text-app-text-dark font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coins.map((coin) => (
                      <tr key={coin.id} className="border-b border-app-secondary-light dark:border-app-secondary-dark">
                        <td className="p-4">
                          <div className="flex items-center">
                            <img src={coin.image} alt={coin.name} className="w-8 h-8 mr-3" />
                            <div>
                              <div className="font-medium text-app-text-light dark:text-app-text-dark">
                                {coin.name}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {coin.symbol.toUpperCase()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-app-text-light dark:text-app-text-dark">
                          ${coin.current_price.toLocaleString()}
                        </td>
                        <td
                          className={`p-4 ${
                            coin.price_change_percentage_24h >= 0
                              ? 'text-green-500'
                              : 'text-red-500'
                          }`}
                        >
                          {coin.price_change_percentage_24h.toFixed(2)}%
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleBuy(coin)}
                            className="btn btn-primary text-sm"
                          >
                            Buy
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-app-secondary-light dark:border-app-secondary-dark">
                      <th className="text-left p-4 text-app-text-light dark:text-app-text-dark font-medium">Coin</th>
                      <th className="text-left p-4 text-app-text-light dark:text-app-text-dark font-medium">Quantity</th>
                      <th className="text-left p-4 text-app-text-light dark:text-app-text-dark font-medium">Buy Price</th>
                      <th className="text-left p-4 text-app-text-light dark:text-app-text-dark font-medium">Current Value</th>
                      <th className="text-left p-4 text-app-text-light dark:text-app-text-dark font-medium">Profit/Loss</th>
                      <th className="text-left p-4 text-app-text-light dark:text-app-text-dark font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center p-4 text-gray-500">
                          No holdings yet. Start by buying some crypto from the Market tab!
                        </td>
                      </tr>
                    ) : (
                      holdings.map((holding, index) => {
                        const currentCoin = coins.find(c => c.id === holding.coinId);
                        const currentPrice = currentCoin ? currentCoin.current_price : holding.buyPrice;
                        const currentValue = holding.quantity * currentPrice;
                        const buyValue = holding.quantity * holding.buyPrice;
                        const profitLoss = currentValue - buyValue;
                        const returnsPct = (profitLoss / buyValue) * 100;

                        return (
                          <tr key={index}>
                            <td className="p-4 cursor-pointer hover:bg-app-secondary-light dark:hover:bg-app-secondary-dark" onClick={() => handleShowStats(holding)}>
                              <div className="flex items-center">
                                <img src={holding.image} alt={holding.name} className="w-8 h-8 mr-3" />
                                <div>
                                  <div className="font-medium">{holding.name}</div>
                                  <div className="text-sm text-gray-500">{holding.symbol.toUpperCase()}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              {holding.quantity.toLocaleString()}
                            </td>
                            <td className="p-4">
                              ${holding.buyPrice.toLocaleString()}
                            </td>
                            <td className="p-4">
                              ${currentPrice.toLocaleString()}
                            </td>
                            <td className="p-4">
                              ${currentValue.toLocaleString()}
                            </td>
                            <td className={`p-4 ${profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              ${Math.abs(profitLoss).toLocaleString()} ({returnsPct.toFixed(2)}%)
                            </td>
                            <td className="p-4">
                              <button
                                onClick={() => handleSell(holding)}
                                className="btn btn-primary text-sm"
                              >
                                Sell
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Buy Modal */}
      {buyModalOpen && selectedCoin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-app-primary-light dark:bg-app-primary-dark rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-app-text-light dark:text-app-text-dark">
              Buy {selectedCoin.name}
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Quantity
              </label>
              <input
                type="number"
                value={buyQuantity}
                onChange={(e) => setBuyQuantity(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-app-secondary-light dark:bg-app-secondary-dark text-app-text-light dark:text-app-text-dark border border-app-secondary-light dark:border-app-secondary-dark focus:outline-none focus:ring-2 focus:ring-app-accent"
                placeholder="Enter quantity"
                min="0"
                step="any"
              />
            </div>
            <div className="mb-4 text-app-text-light dark:text-app-text-dark">
              Total: ${buyQuantity ? (parseFloat(buyQuantity) * selectedCoin.current_price).toLocaleString() : '0'}
            </div>
            <div className="flex space-x-4">
              <button onClick={executeBuy} className="btn btn-primary flex-1">
                Confirm Buy
              </button>
              <button
                onClick={() => {
                  setBuyModalOpen(false);
                  setBuyQuantity('');
                  setSelectedCoin(null);
                }}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sell Modal */}
      {sellModalOpen && selectedCoin && selectedHolding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-app-primary-light dark:bg-app-primary-dark rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-app-text-light dark:text-app-text-dark">
              Sell {selectedHolding.name}
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Quantity (Max: {selectedHolding.quantity})
              </label>
              <input
                type="number"
                value={sellQuantity}
                onChange={(e) => setSellQuantity(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-app-secondary-light dark:bg-app-secondary-dark text-app-text-light dark:text-app-text-dark border border-app-secondary-light dark:border-app-secondary-dark focus:outline-none focus:ring-2 focus:ring-app-accent"
                placeholder="Enter quantity"
                min="0"
                max={selectedHolding.quantity}
                step="any"
              />
            </div>
            <div className="mb-4 text-app-text-light dark:text-app-text-dark">
              Total: ${sellQuantity ? (parseFloat(sellQuantity) * selectedCoin.current_price).toLocaleString() : '0'}
            </div>
            <div className="flex space-x-4">
              <button onClick={executeSell} className="btn btn-primary flex-1">
                Confirm Sell
              </button>
              <button
                onClick={() => {
                  setSellModalOpen(false);
                  setSellQuantity('');
                  setSelectedHolding(null);
                  setSelectedCoin(null);
                }}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Stats Modal */}
      {statsModalOpen && selectedStats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-app-primary-light dark:bg-app-primary-dark rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <img src={selectedStats.image} alt={selectedStats.name} className="w-8 h-8 mr-3" />
                <h2 className="text-2xl font-bold text-app-text-light dark:text-app-text-dark">
                  {selectedStats.name} {'>'}
                </h2>
              </div>
              <div className="text-xl font-bold text-app-text-light dark:text-app-text-dark">
                {selectedStats.quantity.toLocaleString()} {selectedStats.symbol.toUpperCase()}
              </div>
            </div>

            <div className="space-y-6">
              {/* Current Value */}
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Current</div>
                <div className="text-xl font-bold text-app-text-light dark:text-app-text-dark">
                  ${(selectedStats.quantity * (coins.find(c => c.id === selectedStats.coinId)?.current_price ?? selectedStats.buyPrice)).toLocaleString()}
                </div>
              </div>

              {/* Invested Value */}
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Invested</div>
                <div className="text-xl font-bold text-app-text-light dark:text-app-text-dark">
                  ${(selectedStats.quantity * selectedStats.buyPrice).toLocaleString()}
                </div>
              </div>

              {/* Returns */}
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Returns</div>
                {(() => {
                  const currentValue = selectedStats.quantity * (coins.find(c => c.id === selectedStats.coinId)?.current_price ?? selectedStats.buyPrice);
                  const investedValue = selectedStats.quantity * selectedStats.buyPrice;
                  const returns = currentValue - investedValue;
                  const returnsPct = (returns / investedValue) * 100;
                  return (
                    <div className={`text-xl font-bold ${returns >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      ${Math.abs(returns).toLocaleString()} ({returnsPct.toFixed(2)}%)
                    </div>
                  );
                })()}
              </div>

              {/* Returns % */}
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Returns %</div>
                {(() => {
                  const currentValue = selectedStats.quantity * (coins.find(c => c.id === selectedStats.coinId)?.current_price ?? selectedStats.buyPrice);
                  const investedValue = selectedStats.quantity * selectedStats.buyPrice;
                  const returns = currentValue - investedValue;
                  const returnsPercentage = (returns / investedValue) * 100;
                  return (
                    <div className={`text-xl font-bold ${returns >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {returnsPercentage.toFixed(2)}%
                    </div>
                  );
                })()}
              </div>

              {/* Current Price */}
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Current Price</div>
                <div className="text-xl font-bold text-app-text-light dark:text-app-text-dark">
                  ${(coins.find(c => c.id === selectedStats.coinId)?.current_price ?? selectedStats.buyPrice).toLocaleString()}
                </div>
              </div>

              {/* Portfolio Value */}
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Portfolio Value</div>
                <div className="text-xl font-bold text-app-text-light dark:text-app-text-dark">
                  ${portfolioValue.toLocaleString()}
                </div>
              </div>

              {/* Portfolio Returns */}
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Portfolio Returns</div>
                <div className="text-sm text-gray-500">
                  Returns: {(calculatePortfolioStats()?.totalReturnsPercentage ?? 0).toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  setStatsModalOpen(false);
                  setSelectedStats(null);
                }}
                className="btn btn-secondary w-full"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </div>
  );
};

export default Portfolio; 