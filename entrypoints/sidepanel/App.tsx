import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';

// 侧边栏主界面
function App() {
  const [count, setCount] = useState(0);

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>hi-job</CardTitle>
          <CardDescription>侧边栏已就绪，开始构建你的界面</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

export default App;
