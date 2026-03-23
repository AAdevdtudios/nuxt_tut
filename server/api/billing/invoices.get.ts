// GET /api/billing/invoices
// Retrieves all invoices for the authenticated user

export default defineEventHandler(async (event) => {
  const user = await useAuth(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  try {
    // Mock invoice data - in real implementation, fetch from database/Stripe
    const invoices = [
      {
        id: "INV-2024-001",
        date: new Date("2024-03-01"),
        plan: "Pro Plan",
        amount: 29.99,
        currency: "USD",
        status: "paid",
        pdfUrl: "/invoices/INV-2024-001.pdf",
      },
      {
        id: "INV-2024-002",
        date: new Date("2024-02-01"),
        plan: "Pro Plan",
        amount: 29.99,
        currency: "USD",
        status: "paid",
        pdfUrl: "/invoices/INV-2024-002.pdf",
      },
      {
        id: "INV-2024-003",
        date: new Date("2024-01-01"),
        plan: "Starter Plan",
        amount: 9.99,
        currency: "USD",
        status: "paid",
        pdfUrl: "/invoices/INV-2024-003.pdf",
      },
    ];

    return {
      data: invoices,
      total: invoices.length,
      currency: "USD",
    };
  } catch (error) {
    console.error("Invoices fetch error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch invoices",
    });
  }
});
