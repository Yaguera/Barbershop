import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Removed PrismaAdapter completely to bypass database
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string || 'demo@exemplo.com';
        
        if (email.includes('admin')) {
          return {
            id: 'admin-id-123',
            name: 'Administrador',
            email: email,
            role: 'ADMIN',
            image: null,
            phone: '(11) 99999-9999',
          };
        }
        
        if (email.includes('barber') || email.includes('barbeiro')) {
          return {
            id: 'user-barber-1',
            name: 'Lucas Oliveira',
            email: email,
            role: 'BARBER',
            image: '/images/barber_portrait.png',
            phone: '(11) 98888-8888',
          };
        }

        // ALWAYS RETURN MOCK CLIENT USER for Demo
        return {
          id: 'fake-client-id-123',
          name: 'Visitante VIP',
          email: email,
          role: 'CLIENT',
          image: null,
          phone: '(11) 99999-9999',
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || 'CLIENT';
        token.image = user.image;
        token.phone = user.phone;
      }
      if (trigger === 'update' && session) {
        if (session.name !== undefined) token.name = session.name;
        if (session.email !== undefined) token.email = session.email;
        if (session.image !== undefined) token.image = session.image;
        if (session.phone !== undefined) token.phone = session.phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.image = token.image as string;
        session.user.phone = token.phone as string | null;
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  trustHost: true,
  secret: 'my-super-secret-key-for-demo',
});
