import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, title, courseId, sectionId, type, userId } = req.body;
    
    if (!amount || !title || !courseId || !sectionId || !type || !userId) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Amount must be in cents for Stripe (e.g. 10.00 -> 1000)
    // Assuming amount is passed in dollars
    const unitAmount = Math.round(amount * 100);

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: title,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin || 'http://localhost:5173'}/courses?payment=success&courseId=${encodeURIComponent(courseId)}&sectionId=${encodeURIComponent(sectionId)}&type=${encodeURIComponent(type)}&amount=${encodeURIComponent(amount)}`,
      cancel_url: `${req.headers.origin || 'http://localhost:5173'}/courses?payment=cancel`,
      metadata: {
        courseId,
        sectionId,
        type,
        userId
      }
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Error creating checkout session:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
