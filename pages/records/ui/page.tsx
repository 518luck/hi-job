import type { ReactElement } from 'react';
import { useState } from 'react';

import { chatMessageStore, hrStore, jdStore } from '@/shared/infra/storage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';
import { Icons } from '@/shared/ui/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';

import { exportAllData } from '../model/export-all';
import { extractCity } from '../model/extract-city';
import { useRecordedHrs } from '../model/use-recorded-hrs';
import { useRecordedJds } from '../model/use-recorded-jds';
import { useRecordedMessages } from '../model/use-recorded-messages';
import { CityList } from './city-list';
import { CompanyList } from './company-list';
import { HrList } from './hr-list';
import { JdCard } from './jd-card';

// 记录页的展示维度：职位时间流、公司聚合、HR 列表、地区聚合
type Dimension = 'jobs' | 'companies' | 'hrs' | 'cities';

// 记录页：自动记录点击过的职位，可切换职位/公司/HR/地区四个维度查看
function RecordsPage() {
  const [clearOpen, setClearOpen] = useState(false);
  const { jds, companies, loading } = useRecordedJds();
  const { hrs, loading: hrLoading } = useRecordedHrs();
  const { messagesCount } = useRecordedMessages();
  // 统计已覆盖城市数：地址可识别出城市的去重计数
  const cityCount = new Set(
    jds.map((jd) => extractCity(jd.address)).filter((city) => city !== ''),
  ).size;

  // 渲染当前维度的列表：读取中、空态与四个维度列表
  const renderList = (dimension: Dimension): ReactElement | null => {
    if (dimension === 'hrs') {
      if (hrLoading) {
        return <p className="text-xs text-muted-foreground">读取中…</p>;
      }
      return <HrList hrList={hrs} />;
    }
    if (loading) {
      return <p className="text-xs text-muted-foreground">读取中…</p>;
    }
    if (jds.length === 0) {
      return (
        <p className="text-xs text-muted-foreground">
          还没有记录：在 Boss直聘 页面点开职位，这里会自动出现
        </p>
      );
    }
    if (dimension === 'companies') {
      return <CompanyList companies={companies} jds={jds} />;
    }
    if (dimension === 'cities') {
      return <CityList jds={jds} />;
    }
    return (
      <div className="flex flex-col gap-2">
        {jds.map((jd) => (
          <JdCard key={jd.jobId} jd={jd} />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-1 flex-col gap-2 p-4">
      <h2 className="text-base font-medium">记录</h2>
      <p className="text-xs text-muted-foreground">
        已记录 {jds.length} 条职位 · {companies.length} 家公司 · {hrs.length} 位
        HR · {cityCount} 个地区
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => {
            void exportAllData();
          }}
        >
          <Icons.exportData data-icon="inline-start" />
          <span>导出</span>
        </Button>
        <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
          <AlertDialogTrigger
            render={
              <Button variant="destructive" size="sm" className="flex-1" />
            }
          >
            <Icons.clearData data-icon="inline-start" />
            <span>清除数据库</span>
          </AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>清空全部数据？</AlertDialogTitle>
              <AlertDialogDescription>
                将删除 {jds.length} 条职位、{companies.length} 家公司、{' '}
                {hrs.length} 位 HR 与 {messagesCount}{' '}
                条聊天消息的全部数据，删除后无法恢复，建议先导出备份。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  void Promise.all([
                    jdStore.clearAll(),
                    hrStore.clearAllHrs(),
                    chatMessageStore.clearAllChatMessages(),
                  ]);
                  setClearOpen(false);
                }}
              >
                确认清空
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <Tabs defaultValue="jobs">
        <TabsList variant="line" className="w-full">
          <TabsTrigger value="jobs">
            <Icons.briefcase data-icon="inline-start" />
            <span>职位</span>
          </TabsTrigger>
          <TabsTrigger value="companies">
            <Icons.company data-icon="inline-start" />
            <span>公司</span>
          </TabsTrigger>
          <TabsTrigger value="hrs">
            <Icons.person data-icon="inline-start" />
            <span>HR</span>
          </TabsTrigger>
          <TabsTrigger value="cities">
            <Icons.location data-icon="inline-start" />
            <span>地区</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="jobs">{renderList('jobs')}</TabsContent>
        <TabsContent value="companies">{renderList('companies')}</TabsContent>
        <TabsContent value="hrs">{renderList('hrs')}</TabsContent>
        <TabsContent value="cities">{renderList('cities')}</TabsContent>
      </Tabs>
    </div>
  );
}

export { RecordsPage };
