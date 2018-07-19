/* eslint-disable no-console, prefer-arrow-callback, no-undef */

(function () { // eslint-disable-line
  const htmlEscape = function (str) {
    return str.replace(/&/g, '&amp;') // first!
      .replace(/>/g, '&gt;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/`/g, '&#96;');
  }

  const html = function (literalSections, ...substs) {
    // Use raw literal sections: we don’t want
    // backslashes (\n etc.) to be interpreted
    const { raw } = literalSections;

    let result = '';

    substs.forEach((subst, i) => {
      // Retrieve the literal section preceding
      // the current substitution
      let lit = raw[i];

      // In the example, map() returns an array:
      // If substitution is an array (and not a string),
      // we turn it into a string
      if (Array.isArray(subst)) {
        subst = subst.join(''); // eslint-disable-line no-param-reassign
      }

      // If the substitution is preceded by a dollar sign,
      // we escape special characters in it
      if (lit.endsWith('$')) {
        subst = htmlEscape(subst); // eslint-disable-line no-param-reassign
        lit = lit.slice(0, -1);
      }
      result += lit;
      result += subst;
    });
    // Take care of last literal section
    // (Never fails, because an empty template string
    // produces one literal section, an empty string)
    result += raw[raw.length - 1]; // (A)

    return result;
  }

  const tmpl = html`<div class="col-md-6 col-lg-4 offset-lg-4 offset-md-3 fade-in">
    <div class="card animate-on-opacity" id="tx-detail">
      <div class="card-header text-center bg-secondary text-white">
        <h4><i class="fas fa-lock"></i> Transaction Detail</h4>
      </div>
      <div class="card-body">
        <div id="fetch-transaction-detail"></div>

        <div class="row justify-content-center col mt-5 mb-2">
          <button class="btn btn-primary px-4" id="sign-tx" disabled><i class="fas fa-sign-in-alt"></i> SIGN THIS</button>
        </div>

        <div class="row justify-content-center col mt-5 mb-2">
          <button class="btn btn-danger px-4" id="cancel-sign-tx">CANCEL</button>
        </div>
      </div>
    </div><!-- #sign-in-detail -->

    <div class="card hide-on-screen h-30 loader-wrapper align-items-center" id="loading-box">
        <div class="lds-roller">
            <div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
          </div>
    </div><!-- #loading-box -->

    <div class="card hide-on-screen" id="tx-broadcasting">
      <div class="card-header text-center bg-secondary text-white">
          <h4><i class="fas fa-broadcast-tower"></i> Broadcasting</h4>
      </div>
      <div class="justify-content-center flex-row align-items-center h-30 d-flex p-2">
          <div class="lds-roller">
            <div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
          </div>
      </div>
    </div><!-- #sign-in-broadcasting -->

    <div class="card hide-on-screen" id="thank-you-card">
      <div class="card-header text-center bg-success text-white">
          <h4><i class="fas fa-check-square"></i> Thank You!</h4>
      </div>
      <div class="card-body">
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris consectetur sollicitudin lacus sit amet lobortis. Duis consectetur lacinia sem. Sed vitae nulla pellentesque, porttitor mi vel, pulvinar turpis. </p>
          <div class="text-center">
            <button class="btn btn-primary" id="back-to-app"><i class="fas fa-mobile-alt"></i> Back to app</button>
          </div>
      </div>
    </div><!-- #thank-you-card -->
  </div>`;

  document.getElementById('main').innerHTML = tmpl;

  const txDetail = document.getElementById('tx-detail');
  const txBroadcasting = document.getElementById('tx-broadcasting');
  const thankYouCard = document.getElementById('thank-you-card');

  const transactionDetail = document.getElementById('transaction-detail');
  const transactionSignBtn = document.getElementById('sign-tx');
  const transactionCancelSignBtn = document.getElementById('cancel-sign-tx');
  const backToAppBtn = document.getElementById('back-to-app');

  const signTransaction = function () {
    txDetail.style.display = 'none';
    txBroadcasting.style.display = 'flex';

    setTimeout(function () {
      txBroadcasting.style.display = 'none';
      thankYouCard.style.display = 'flex';
    }, 5000);
  }

  const receiveMessage = function (event) {
    const tx = JSON.parse(event.data);

    const domFragment = document.createDocumentFragment()

    Object.keys(tx).forEach(function (key) {
      const div = document.createElement('div');
      div.classList.add('row', 'flex-nowrap', 'my-2');

      const divKey = document.createElement('div');
      divKey.classList.add('col-5');
      divKey.appendChild(document.createTextNode(key));

      const divColon = document.createElement('div');
      divColon.classList.add('col-1', 'd-none', 'd-md-flex');
      divColon.innerHTML = ':';

      const divVal = document.createElement('div');
      divVal.classList.add('col-6');
      divVal.appendChild(document.createTextNode(tx[key]));

      div.appendChild(divKey);
      div.appendChild(divColon);
      div.appendChild(divVal);

      domFragment.appendChild(div);
    });

    transactionDetail.appendChild(domFragment);
    transactionSignBtn.disabled = false;
    transactionCancelSignBtn.disabled = false;
  }

  window.addEventListener('message', receiveMessage, false);
  transactionSignBtn.addEventListener('click', signTransaction);
  transactionCancelSignBtn.addEventListener('click', () => self.close());
  backToAppBtn.addEventListener('click', () => self.close());
})();
