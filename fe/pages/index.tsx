import { useState, useEffect, AwaitedReactNode, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from 'react';
import { Button } from "@nextui-org/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@nextui-org/modal";
import { Form } from "@nextui-org/form";
import { Select, SelectItem } from "@nextui-org/select";
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, getKeyValue } from "@nextui-org/table";
import { DatePicker } from "@nextui-org/date-picker";
import { CalendarDate, parseDate } from "@internationalized/date";
import {Input} from "@nextui-org/input";

export default function IndexPage() {
  // 消费品类选项
  // const categories = ['衣服', '化妆品', '电子产品', '家具', '其他'];
  const categories = [{ label: '衣服', key: '衣服' }, { label: '化妆品', key: '化妆品' }, { label: '电子产品', key: '电子产品' }, { label: '家居用品', key: '家居用品' }, { label: '其他', key: '其他' }];
  // 支付方式选项
  // const paymentMethods = ['花呗', '白条', '浦发银行信用卡', '其他'];
  const paymentMethods = [{ label: '花呗', key: '花呗' }, { label: '白条', key: '白条' }, { label: '浦发银行信用卡', key: '浦发银行信用卡' }, { label: '其他', key: '其他' }];
  // 状态管理
  const [changExpenses, setChangExpenses] = useState<Array<{ id: number, amount: number, date: string, category: string, paymentMethod: string, user: string }>>([]); // 畅的花销
  const [jieExpenses, setJieExpenses] = useState<Array<{ id: number, amount: number, date: string, category: string, paymentMethod: string, user: string }>>([]) // 杰的花销
  const { isOpen, onOpen, onClose } = useDisclosure(); // 控制弹窗显示
  const [summaryType, setSummaryType] = useState<any>('category'); // 汇总类型：category 或 paymentMethod

  const getCurrentDate = () => {
    const date = new Date();
    const year = date.getFullYear(); // 获取年份（如 2023）
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 获取月份（注意月份从 0 开始，需要 +1）
    const day = String(date.getDate()).padStart(2, '0'); // 获取日期

    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
  };

  // 获取畅的当月花销记录
  const fetchChangExpenses = async () => {
    try {
      const response = await fetch(
        `https://account-book.post.jieyuu.us.kg/api/expenses/chang`
      );
      const data = await response.json();
      setChangExpenses(data);
    } catch (error) {
      console.error('Failed to fetch Chang expenses:', error);
    }
  };
  // 获取杰的当月花销记录
  const fetchJieExpenses = async () => {
    try {
      const response = await fetch(
        `https://account-book.post.jieyuu.us.kg/api/expenses/jie`
      );
      const data = await response.json();
      setJieExpenses(data);
    } catch (error) {
      console.error('Failed to fetch Jie expenses:', error);
    }
  };
  // 页面加载时获取数据
  useEffect(() => {
    fetchChangExpenses();
    fetchJieExpenses();
  }, []);
  // 添加花销
  const addExpense = async (values: { date: { format: (arg0: string) => any; }; category: any; paymentMethod: any; amount: string; user: any; }) => {
    try {
      const response = await fetch(`https://account-book.post.jieyuu.us.kg/api/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: values.date.format('YYYY-MM-DD'),
          category: values.category,
          paymentMethod: values.paymentMethod,
          amount: parseFloat(values.amount),
          user: values.user,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add expense');
      }

      // 重新获取数据
      fetchChangExpenses();
      fetchJieExpenses();

      // 关闭弹窗
      // setIsModalVisible(false);
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };
  const onSubmit = (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(e.currentTarget));
  };
  // 计算某个用户在某分类下的总花销
  const getTotalByCategory = (expenses: any[], category: string) => {
    return expenses
      .filter((expense) => expense.category === category)
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  // 计算某个用户在某支付方式下的总花销
  const getTotalByPaymentMethod = (expenses: any[], method: string) => {
    return expenses
      .filter((expense) => expense.paymentMethod === method)
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  // 根据汇总类型生成汇总数据
  const getSummaryData = () => {
    // 畅和杰的总花销
    const totalChang = changExpenses.reduce((sum: any, e: { amount: any; }) => sum + e.amount, 0);
    const totalJie = jieExpenses.reduce((sum: any, e: { amount: any; }) => sum + e.amount, 0);

    // 总花销行
    const totalRow = {
      key: 'total',
      type: '总花销',
      chang: totalChang,
      jie: totalJie,
      remainingChang: 1500 - totalChang, // 畅的剩余额度
      remainingJie: 1000 - totalJie, // 杰的剩余额度
    };

    // 分类或支付方式汇总行
    const detailRows =
      summaryType === 'category'
        ? categories.map((category) => ({
          key: `category-${category.key}`,
          type: `${category.label}`,
          chang: getTotalByCategory(changExpenses, category.key),
          jie: getTotalByCategory(jieExpenses, category.key),
          remainingChang: null, // 分类行不需要显示剩余额度
          remainingJie: null,
        }))
        : paymentMethods.map((method) => ({
          key: `payment-${method.key}`,
          type: `${method.label}`,
          chang: getTotalByPaymentMethod(changExpenses, method.key),
          jie: getTotalByPaymentMethod(jieExpenses, method.key),
          remainingChang: null, // 支付方式行不需要显示剩余额度
          remainingJie: null,
        }));

    return [totalRow, ...detailRows];
  };

  const summaryColumns = [
    { key: "type", label: "分类" },
    { key: "chang", label: "畅总花销" },
    { key: "remainingChang", label: "畅剩余额度" },
    { key: "jie", label: "杰总花销" },
    { key: "remainingJie", label: "杰剩余额度" }
  ]

  // 花销明细表格列定义
  const detailColumns = [
    { label: '日期', key: 'date' },
    { label: '消费品类', key: 'category' },
    { label: '支付方式', key: 'paymentMethod' },
    { label: '支付金额', key: 'amount' },
    { label: '用户', key: 'user' }, // 显示用户名称
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* 添加数据按钮 */}
      <div style={{ textAlign: 'right', marginBottom: '20px' }}>
        <Button color="primary" onPress={onOpen}>添加数据</Button>
      </div>

      {/* 弹窗表单 */}
      <Modal defaultOpen={true}>
        <ModalContent>
          {
            (onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">添加花销</ModalHeader>
                <ModalBody>
                  <Form onSubmit={onSubmit}>
                    <DatePicker name="date" isRequired defaultValue={parseDate(getCurrentDate())} className="max-w-[284px]" label="请选择消费日期" />
                    <Select name="category" isRequired defaultSelectedKeys={["衣服"]} label="请选择消费品类" className="max-w-[284px]" items={categories}>
                      {(item) => <SelectItem>{item.label}</SelectItem>}
                    </Select>
                    <Select name="paymentMethod" isRequired defaultSelectedKeys={["花呗"]} label="请选择支付方式" className="max-w-[284px]" items={paymentMethods}>
                      {(item) => <SelectItem>{item.label}</SelectItem>}
                    </Select>
                    <Input name="amount" isRequired type="number" label="请输入金额" className="max-w-[284px]" />
                    <Select name="user" isRequired defaultSelectedKeys={["畅"]} label="请选择用户" className="max-w-[284px]" items={[{ label: '畅', key: '畅' }, { label: '杰', key: '杰' }]}>
                      {(item) => <SelectItem>{item.label}</SelectItem>}
                    </Select>
                  </Form>
                </ModalBody>
                <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onPress={onClose}>
                  Action
                </Button>
              </ModalFooter>
              </>
            )
          }
        </ModalContent>
      </Modal>

      {/* 汇总部分 */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <Select className="max-w-xs" label="选择汇总方式" defaultSelectedKeys={["category"]} onSelectionChange={(selectedKeys) => setSummaryType(selectedKeys['currentKey'])}>
            <SelectItem key="category">按消费品类汇总</SelectItem>
            <SelectItem key="paymentMethod">按支付方式汇总</SelectItem>
          </Select>
        </div>
        <Table>
          <TableHeader columns={summaryColumns} >
            {(column: { key: string; label: string; }) => <TableColumn key={column.key}>{column.label}</TableColumn>}
          </TableHeader>
          <TableBody emptyContent={"No rows to display."} items={getSummaryData()}>
            {(item) => (
              <TableRow key={item.key}>
                {(columnKey) => <TableCell>{getKeyValue(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 中部：畅和杰的花销明细 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Table>
            <TableHeader columns={detailColumns} >
              {(column: { key: string; label: string; }) => <TableColumn key={column.key}>{column.label}</TableColumn>}
            </TableHeader>
            <TableBody emptyContent={"No rows to display."} items={changExpenses}>
              {(item) => (
                <TableRow key={item.id}>
                  {(columnKey) => <TableCell>{getKeyValue(item, columnKey)}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div>
          <Table>
            <TableHeader columns={detailColumns} >
              {(column: { key: string; label: string; }) => <TableColumn key={column.key}>{column.label}</TableColumn>}
            </TableHeader>
            <TableBody emptyContent={"No rows to display."} items={jieExpenses}>
              {(item) => (
                <TableRow key={item.id}>
                  {(columnKey) => <TableCell>{getKeyValue(item, columnKey)}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

      </div>



    </div>
  );
}
