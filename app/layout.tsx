import { AuthProvider } from "@/lib/contexts/AuthContext";
import "@/styles/variables.css";
import "@/styles/global.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
