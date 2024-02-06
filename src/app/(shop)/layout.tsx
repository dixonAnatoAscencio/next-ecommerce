import { Footer, Sidebar, TopMenu } from "@/components";


export default function ShopLayout({ children }: { 
    children: React.ReactNode 
}) {
    return (//layout pagina de la tienda 
        <main className="min-h-screen">
            <TopMenu />
            <Sidebar />

            <div className="px-0 sm:px-10">
            {children}

            </div>

            <Footer />
        </main>
    );
}