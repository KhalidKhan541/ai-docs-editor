import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prismadb from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { successResponse, errorResponse } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return errorResponse(
        Object.values(errors)
          .flat()
          .join(", "),
        400
      );
    }

    const { name, email, password } = result.data;
    const normalizedEmail = email.toLowerCase();

    const existingUser = await prismadb.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return errorResponse("An account with this email already exists", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prismadb.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    const orgSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 50);

    const org = await prismadb.organization.create({
      data: {
        name: `${name}'s Workspace`,
        slug: `${orgSlug}-${user.id.slice(0, 6)}`,
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
    });

    return successResponse(
      {
        user: { ...user, defaultOrgId: org.id },
        message: "Account created successfully",
      },
      201
    );
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return errorResponse("Internal server error", 500);
  }
}
