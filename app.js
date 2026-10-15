/* Gas Bill Check Pakistan — app.js
   Clean vanilla JS so it can be converted to React later. */

/* ---------- Bill checker ---------- */
(function () {
  var forms = document.querySelectorAll(".bill-checker");
  forms.forEach(function (form) {
    var tabs = form.querySelectorAll(".tab");
    var companyInput = form.querySelector('[name="company"]');
    var numberInput = form.querySelector('[name="consumer"]');
    var hint = form.querySelector(".hint");
    var error = form.querySelector(".error");

    function setCompany(c) {
      companyInput.value = c;
      tabs.forEach(function (t) { t.classList.toggle("active", t.dataset.company === c); });
      if (c === "sngpl") {
        numberInput.placeholder = "e.g. 12345678901";
        numberInput.maxLength = 11;
        hint.textContent = "11-digit Consumer Number (Account ID on your old bill)";
      } else {
        numberInput.placeholder = "e.g. 1234567890";
        numberInput.maxLength = 10;
        hint.textContent = "10-digit Customer Number (on your old bill)";
      }
      error.style.display = "none";
    }
    tabs.forEach(function (t) {
      t.addEventListener("click", function () { setCompany(t.dataset.company); });
    });
    setCompany(companyInput.value || "sngpl");

    // digits only
    numberInput.addEventListener("input", function () {
      numberInput.value = numberInput.value.replace(/\D/g, "");
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var c = companyInput.value;
      var n = numberInput.value.trim();
      var need = c === "sngpl" ? 11 : 10;
      if (n.length !== need || !/^\d+$/.test(n)) {
        error.textContent = "Please enter a valid " + need + "-digit number.";
        error.style.display = "block";
        return;
      }
      error.style.display = "none";
      // Open the official billing portal. Numbers are entered by the user there.
      var url = c === "sngpl" ? "https://www.sngpl.com.pk/" : "https://viewbill.ssgc.com.pk/";
      window.open(url, "_blank", "noopener");
    });
  });
})();

/* ---------- Gas bill calculator ---------- */
/* Tariff: Rs per MMBtu by slab (domestic). 1 hm3 ≈ 3.5 MMBtu.
   Sources: OGRA-notified tariffs via press (Oct 2026). Estimates only. */
var TARIFF = {
  protected: {
    fixed: 600, meterRent: 40,
    slabs: [[0.25, 200], [0.50, 250], [0.60, 300], [0.90, 350]]
  },
  "non-protected": {
    // fixed depends on usage: 1500 up to 1.5 hm3, 3000 above
    meterRent: 40,
    slabs: [[0.25, 500], [0.60, 850], [1.00, 1250], [1.50, 1450], [2.00, 1900], [3.00, 3300], [4.00, 3800], [Infinity, 4200]]
  }
};
var HM3_TO_MMBTU = 3.5;

(function () {
  var form = document.getElementById("calc-form");
  if (!form) return;
  var out = document.getElementById("calc-result");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var hm3 = parseFloat(document.getElementById("usage").value);
    var cat = document.getElementById("category").value; // protected | non-protected | auto
    if (!(hm3 > 0)) return;

    if (cat === "auto") cat = hm3 <= 0.9 ? "protected" : "non-protected";
    var t = TARIFF[cat];
    var mmbtu = hm3 * HM3_TO_MMBTU;

    var rate = t.slabs[t.slabs.length - 1][1];
    for (var i = 0; i < t.slabs.length; i++) {
      if (hm3 <= t.slabs[i][0]) { rate = t.slabs[i][1]; break; }
    }

    var gasCharge = mmbtu * rate;
    var fixed = cat === "protected" ? t.fixed : (hm3 <= 1.5 ? 1500 : 3000);
    var subtotal = gasCharge + fixed + t.meterRent;
    var gst = subtotal * 0.18;
    var total = subtotal + gst;

    function rs(x) { return "Rs " + Math.round(x).toLocaleString("en-PK"); }
    out.innerHTML =
      "<h3>Estimated Monthly Bill</h3>" +
      '<div class="row"><span>Category</span><strong>' + (cat === "protected" ? "Protected" : "Non-Protected") + "</strong></div>" +
      '<div class="row"><span>Gas used</span><span>' + hm3 + " hm³ (≈ " + mmbtu.toFixed(2) + " MMBtu)</span></div>" +
      '<div class="row"><span>Slab rate</span><span>Rs ' + rate.toLocaleString("en-PK") + " / MMBtu</span></div>" +
      '<div class="row"><span>Gas charges</span><span>' + rs(gasCharge) + "</span></div>" +
      '<div class="row"><span>Fixed charges + meter rent</span><span>' + rs(fixed + t.meterRent) + "</span></div>" +
      '<div class="row"><span>GST (18% approx)</span><span>' + rs(gst) + "</span></div>" +
      '<div class="row total"><span>Estimated total</span><span>' + rs(total) + "</span></div>" +
      '<p class="disclaimer">Estimate only — based on publicly reported 2026 slabs (1 hm³ ≈ 3.5 MMBtu). ' +
      "Actual GCV, meter-rent and taxes vary. Tariffs can change; the government plans a single tariff from July 2027. " +
      "Always confirm with your official SNGPL/SSGC bill.</p>";
    out.style.display = "block";
    out.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
})();
