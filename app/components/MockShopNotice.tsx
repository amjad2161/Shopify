export function MockShopNotice() {
  return (
    <section
      className="mock-shop-notice"
      aria-labelledby="mock-shop-notice-heading"
    >
      <div className="inner">
        <p className="mock-shop-eyebrow">Development preview</p>
        <h2 id="mock-shop-notice-heading">Demo catalog active</h2>
        <p>
          You&rsquo;re browsing sample products from{' '}
          <strong>mock.shop</strong>. Link your Shopify store when you&rsquo;re
          ready to go live.
        </p>
        <p className="small">
          Run <code>npx shopify hydrogen link</code> and add your storefront
          credentials to <code>.env</code>.
        </p>
      </div>
    </section>
  );
}
