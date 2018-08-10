import { safeHtml } from 'common-tags'

export default function createElement(document, accountDetail) {
  const { accountNo } = accountDetail
  const splitAccNo = `${accountNo.substring(0, 5)}.${accountNo.substring(5, 10)}.${accountNo.substring(10, 15)}.${accountNo.substring(15, accountNo.length)}`

  const div = document.createElement('div')
  div.classList.add('row')
  div.innerHTML = (safeHtml`
  <div class="col-12 px-5">
    <h2 class="page-title">Your Account Detail</h2>
    <div class="row my-2 border-bottom py-3">
        <div class="col-sm-4 text-capitalize text-strong">
          Account Number
        </div>
        <div class="col-sm-8 text-grey">
          ${splitAccNo}
        </div>
    </div>
    <div class="row my-2 border-bottom py-3">
        <div class="col-sm-4 text-capitalize text-strong">
          Account Address
        </div>
        <div class="col-sm-8 text-grey">
          ${accountDetail.address}
        </div>
    </div>
    <div class="row my-2 border-bottom py-3">
        <div class="col-sm-4 text-capitalize text-strong">
          Public Key
        </div>
        <div class="col-sm-8 text-grey word-wrap">
          ${accountDetail.publicKey}
        </div>
    </div>
  </div>
  <div class="col-12 mt-4 px-5">
    <button class="btn btn-danger btn-delete px-4" id="delete-this-account"><i class="fas fa-ban"></i> Delete</button>
  </div>
  `)

  return div
}
