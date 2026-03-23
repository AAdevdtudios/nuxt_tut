// GET /api/subscription/current
// Retrieves the current user's subscription details

export default defineEventHandler(async (event) => {
  // Check if user is authenticated
  const user = await useAuth(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  try {
    // Mock subscription data - in real implementation, fetch from database
    const subscription = {
      id: `sub_${user.id}`,
      userId: user.id,
      planId: "pro",
      status: "active",
      currentPeriodStart: new Date("2024-03-01"),
      currentPeriodEnd: new Date("2024-04-01"),
      canceledAt: null,
      trialEndsAt: null,
      plan: {
        name: "Pro Plan",
        price: 29.99,
        currency: "USD",
      },
    };

    return subscription;
  } catch (error) {
    console.error("Subscription fetch error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch subscription",
    });
  }
});
