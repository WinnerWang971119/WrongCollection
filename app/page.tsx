import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold">錯題收集</CardTitle>
          <CardDescription className="text-lg">
            WrongCollection - 學習路上的最佳夥伴
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-center text-muted-foreground">
            輕鬆管理您的錯題本，智能複習系統
          </p>
          <Button size="lg" className="w-full">
            立即開始
          </Button>
          <Button size="lg" variant="outline" className="w-full">
            了解更多
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
