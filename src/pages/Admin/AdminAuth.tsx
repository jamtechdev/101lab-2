import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const AdminAuth = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        setTimeout(() => {
            setIsLoading(false);
            toast.success(t('adminAuth.loginSuccess'));
            navigate("/admin");
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Button
                    variant="ghost"
                    onClick={() => navigate("/")}
                    className="mb-4 text-primary-foreground hover:text-primary-foreground/80"
                >
                    <ArrowLeft className="mr-2" />
                    {t('adminAuth.backToHome')}
                </Button>

                <Card className="shadow-medium">
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl font-bold text-primary">
                            GreenBidz
                        </CardTitle>
                        <CardDescription>{t('adminAuth.adminPortal')}</CardDescription>
                    </CardHeader>

                    <CardContent>
                        <Tabs defaultValue="signin" className="w-full">
                            <TabsList className="grid w-full grid-cols-1">
                                {/* Only Signin Now */}
                                <TabsTrigger value="signin">{t('adminAuth.signin')}</TabsTrigger>
                            </TabsList>

                            <TabsContent value="signin">
                                <form onSubmit={handleSignIn} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="signin-email">{t('adminAuth.email')}</Label>
                                        <Input
                                            id="signin-email"
                                            type="email"
                                            placeholder="company@yourcompany.com"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="signin-password">{t('adminAuth.password')}</Label>
                                        <Input
                                            id="signin-password"
                                            type="password"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        variant="hero"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? t('adminAuth.loggingIn') : t('adminAuth.signin')}
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminAuth;
