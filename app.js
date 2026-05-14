var transactions = [];
var chart = null;

document.addEventListener('DOMContentLoaded', function () {
  try {
    var saved = localStorage.getItem('expenses');
    if (saved) transactions = JSON.parse(saved);
  } catch (e) {}

  var savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);

  document.getElementById('addBtn').addEventListener('click', addTransaction);
  document.getElementById('themeBtn').addEventListener('click', toggleTheme);

  document.getElementById('itemName').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') addTransaction();
  });
  document.getElementById('amount').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') addTransaction();
  });

  renderAll();
});

function toggleTheme() {
  var body = document.body;
  if (body.classList.contains('light')) {
    setTheme('dark');
  } else {
    setTheme('light');
  }
}

function setTheme(theme) {
  var body = document.body;
  var btn  = document.getElementById('themeBtn');

  body.classList.remove('light', 'dark');
  body.classList.add(theme);

  if (theme === 'dark') {
    btn.textContent = '☀️ Light Mode';
  } else {
    btn.textContent = '🌙 Dark Mode';
  }

  try { localStorage.setItem('theme', theme); } catch (e) {}

  if (chart) {
    chart.destroy();
    chart = null;
  }
  renderChart();
}

function addTransaction() {
  var nameEl   = document.getElementById('itemName');
  var amountEl = document.getElementById('amount');
  var catEl    = document.getElementById('category');
  var errorEl  = document.getElementById('errorMsg');

  var name   = nameEl.value.trim();
  var amount = parseFloat(amountEl.value);
  var cat    = catEl.value;

  if (name === '') {
    errorEl.textContent = '⚠ Item Name cannot be empty.';
    nameEl.focus();
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    errorEl.textContent = '⚠ Please enter a valid amount greater than 0.';
    amountEl.focus();
    return;
  }

  errorEl.textContent = '';

  transactions.push({ id: Date.now(), name: name, amount: amount, category: cat });

  saveData();
  renderAll();

  nameEl.value   = '';
  amountEl.value = '';
  catEl.value    = 'Food';
  nameEl.focus();
}

function deleteTransaction(id) {
  transactions = transactions.filter(function (t) { return t.id !== id; });
  saveData();
  renderAll();
}

function saveData() {
  try { localStorage.setItem('expenses', JSON.stringify(transactions)); } catch (e) {}
}

function renderAll() {
  renderBalance();
  renderList();
  renderChart();
}

function renderBalance() {
  var total = 0;
  for (var i = 0; i < transactions.length; i++) {
    total += transactions[i].amount;
  }
  document.getElementById('totalBalance').textContent = '$' + total.toFixed(2);
}

function renderList() {
  var listEl  = document.getElementById('transactionList');
  var emptyEl = document.getElementById('emptyText');

  // Remove old transaction rows (keep emptyText)
  var rows = listEl.querySelectorAll('.txn-item');
  for (var i = 0; i < rows.length; i++) {
    rows[i].parentNode.removeChild(rows[i]);
  }

  if (transactions.length === 0) {
    emptyEl.style.display = 'block';
    return;
  }

  emptyEl.style.display = 'none';

  var list = transactions.slice().reverse();

  for (var j = 0; j < list.length; j++) {
    var t = list[j];

    var row = document.createElement('div');
    row.className = 'txn-item';

    var left = document.createElement('div');
    left.className = 'txn-left';

    var nameEl = document.createElement('div');
    nameEl.className = 'txn-name';
    nameEl.textContent = t.name;

    var amountEl = document.createElement('div');
    amountEl.className = 'txn-amount';
    amountEl.textContent = '$' + t.amount.toFixed(2);

    var badge = document.createElement('span');
    badge.className = 'txn-badge badge-' + t.category;
    badge.textContent = t.category;

    left.appendChild(nameEl);
    left.appendChild(amountEl);
    left.appendChild(badge);

    var delBtn = document.createElement('button');
    delBtn.className = 'btn-delete';
    delBtn.textContent = 'Delete';
    delBtn.setAttribute('data-id', t.id);
    delBtn.addEventListener('click', function () {
      deleteTransaction(Number(this.getAttribute('data-id')));
    });

    row.appendChild(left);
    row.appendChild(delBtn);
    listEl.appendChild(row);
  }
}

function renderChart() {
  var canvas   = document.getElementById('spendingChart');
  var emptyEl  = document.getElementById('chartEmpty');

  // Sum per category
  var food = 0, transport = 0, fun = 0;
  for (var i = 0; i < transactions.length; i++) {
    var t = transactions[i];
    if (t.category === 'Food')      food      += t.amount;
    if (t.category === 'Transport') transport += t.amount;
    if (t.category === 'Fun')       fun       += t.amount;
  }

  var hasData = food > 0 || transport > 0 || fun > 0;

  if (!hasData) {
    canvas.style.display = 'none';
    emptyEl.style.display = 'block';
    if (chart) { chart.destroy(); chart = null; }
    return;
  }

  canvas.style.display = 'block';
  emptyEl.style.display = 'none';

  var data   = [food, transport, fun];
  var colors = ['#4caf50', '#2196f3', '#ff9800'];

  if (chart) {
    // Just update data
    chart.data.datasets[0].data = data;
    chart.update();
  } else {
    chart = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: ['Food', 'Transport', 'Fun'],
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                var total = ctx.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                var pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                return ' ' + ctx.label + ': $' + ctx.parsed.toFixed(2) + ' (' + pct + '%)';
              }
            }
          }
        }
      }
    });
  }
}
