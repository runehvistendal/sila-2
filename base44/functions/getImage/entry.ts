Deno.serve(async (req) => {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl || typeof imageUrl !== 'string') {
      return Response.json(
        { error: 'Invalid image URL' },
        { status: 400 }
      );
    }

    // Validate it's a valid URL
    try {
      new URL(imageUrl);
    } catch {
      return Response.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Return the image URL (for direct use by frontend)
    return Response.json({
      url: imageUrl,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('getImage error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});