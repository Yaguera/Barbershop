import { safeRedirect, sanitizeProductionAuthEnv } from '@/core/utils/safe-redirect';
import { prisma } from '@/infra/db/prisma-client';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { z } from 'zod';

sanitizeProductionAuthEnv();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { email, password } = parsedCredentials.data;
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.active || !user.passwordHash) {
          return null;
        }

        const passwordsMatch = await bcrypt.compare(password, user.passwordHash);

        if (passwordsMatch) {
          const cleanImage = user.image && (user.image.startsWith('data:') || user.image.length > 150) ? 'DB_IMAGE' : user.image;
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: cleanImage,
            phone: user.phone,
          };
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const existing = await prisma.user.findUnique({ where: { email: user.email }, select: { active: true } });
      return !existing || existing.active;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || 'CLIENT';
        token.phone = user.phone;
        const img = user.image || null;
        if (img && (img.startsWith('data:') || img.length > 150 || img === 'BASE64_IN_DB' || img === 'DB_IMAGE')) {
          token.image = 'DB_IMAGE';
        } else {
          token.image = img;
        }
      }
      // Re-read account state on every session access: deactivation revokes existing JWTs.
      const current = typeof token.id === 'string' ? await prisma.user.findUnique({
        where: { id: token.id }, select: { sessionVersion: true, active: true, role: true, name: true, email: true, phone: true, image: true },
      }) : null;
      if (!current?.active || (!user && token.sessionVersion !== current.sessionVersion)) return null;
      token.sessionVersion = current.sessionVersion;
      token.role = current.role;
      token.name = current.name;
      token.email = current.email;
      token.phone = current.phone;
      token.image = current.image?.startsWith('data:') ? 'DB_IMAGE' : current.image;
      // Remove any large properties automatically attached by Google/OAuth providers or adapter
      delete token.picture;
      delete token.sub;
      delete token.passwordHash;
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.phone = token.phone as string | null;
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;

        if ((token.image === 'BASE64_IN_DB' || token.image === 'DB_IMAGE') && token.id) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { image: true },
          });
          session.user.image = dbUser?.image || null;
        } else {
          session.user.image = (token.image as string) || null;
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      let effectiveBaseUrl = baseUrl;
      const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
      const configuredUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL;

      if (configuredUrl && (!isProd || !configuredUrl.includes('localhost'))) {
        effectiveBaseUrl = configuredUrl;
      } else if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
        effectiveBaseUrl = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
      } else if (process.env.VERCEL_URL) {
        effectiveBaseUrl = `https://${process.env.VERCEL_URL}`;
      } else if (isProd && effectiveBaseUrl.includes('localhost')) {
        effectiveBaseUrl = 'https://barbeariajosecarlos-chi.vercel.app';
      }

      return safeRedirect(url, effectiveBaseUrl);
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  trustHost: true,
});
