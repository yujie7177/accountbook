import { Table, Input, Button, Row, Col, Form, DatePicker, Select, Modal } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';

const { Option } = Select;

// 消费品类选项
const categories = ['衣服', '化妆品', '电子产品', '家具', '其他'];

// 支付方式选项
const paymentMethods = ['花呗', '白条', '浦发银行信用卡', '其他'];

export default function Home() {
  // 状态管理
  const [expenses, setExpenses] = useState([]); // 所有花销
  const [changExpenses, setChangExpenses] = useState([]); // 畅的花销
  const [jieExpenses, setJieExpenses] = useState([]); // 杰的花销
  const [isModalVisible, setIsModalVisible] = useState(false); // 控制弹窗显示
  const [summaryType, setSummaryType] = useState('category'); // 汇总类型：category 或 paymentMethod

  // 获取当前月的起始和结束日期
  const getCurrentMonthRange = () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    return { startDate, endDate };
  };

  // 获取当月花销记录
  const fetchExpenses = async () => {
    const { startDate, endDate } = getCurrentMonthRange();
    try {
      const response = await fetch(
        `https://account-book.post.jieyuu.us.kg/api/expenses?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    }
  };

  // 获取畅的当月花销记录
  const fetchChangExpenses = async () => {
    const { startDate, endDate } = getCurrentMonthRange();
    try {
      const response = await fetch(
        `https://account-book.post.jieyuu.us.kg/api/expenses/chang?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await response.json();
      setChangExpenses(data);
    } catch (error) {
      console.error('Failed to fetch Chang expenses:', error);
    }
  };

  // 获取杰的当月花销记录
  const fetchJieExpenses = async () => {
    const { startDate, endDate } = getCurrentMonthRange();
    try {
      const response = await fetch(
        `https://account-book.post.jieyuu.us.kg/api/expenses/jie?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await response.json();
      setJieExpenses(data);
    } catch (error) {
      console.error('Failed to fetch Jie expenses:', error);
    }
  };

  // 页面加载时获取数据
  useEffect(() => {
    fetchExpenses();
    fetchChangExpenses();
    fetchJieExpenses();
  }, []);

  // 添加花销
  const addExpense = async (values) => {
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
      fetchExpenses();
      fetchChangExpenses();
      fetchJieExpenses();

      // 关闭弹窗
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  // 计算某个用户在某分类下的总花销
  const getTotalByCategory = (expenses, category) => {
    return expenses
      .filter((expense) => expense.category === category)
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  // 计算某个用户在某支付方式下的总花销
  const getTotalByPaymentMethod = (expenses, method) => {
    return expenses
      .filter((expense) => expense.paymentMethod === method)
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  // 根据汇总类型生成汇总数据
  const getSummaryData = () => {
    // 畅和杰的总花销
    const totalChang = changExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalJie = jieExpenses.reduce((sum, e) => sum + e.amount, 0);

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
            key: `category-${category}`,
            type: `消费品类: ${category}`,
            chang: getTotalByCategory(changExpenses, category),
            jie: getTotalByCategory(jieExpenses, category),
            remainingChang: null, // 分类行不需要显示剩余额度
            remainingJie: null,
          }))
        : paymentMethods.map((method) => ({
            key: `payment-${method}`,
            type: `支付方式: ${method}`,
            chang: getTotalByPaymentMethod(changExpenses, method),
            jie: getTotalByPaymentMethod(jieExpenses, method),
            remainingChang: null, // 支付方式行不需要显示剩余额度
            remainingJie: null,
          }));

    return [totalRow, ...detailRows];
  };

  // 表格列定义
  const summaryColumns = [
    { title: '分类', dataIndex: 'type', key: 'type' },
    { title: '畅总花销', dataIndex: 'chang', key: 'chang' },
    { title: '畅剩余额度', dataIndex: 'remainingChang', key: 'remainingChang' },
    { title: '杰总花销', dataIndex: 'jie', key: 'jie' },
    { title: '杰剩余额度', dataIndex: 'remainingJie', key: 'remainingJie' },
  ];

  // 花销明细表格列定义
  const detailColumns = [
    { title: '日期', dataIndex: 'date', key: 'date' },
    { title: '消费品类', dataIndex: 'category', key: 'category' },
    { title: '支付方式', dataIndex: 'paymentMethod', key: 'paymentMethod' },
    { title: '支付金额', dataIndex: 'amount', key: 'amount' },
    { title: '用户', dataIndex: 'user', key: 'user' }, // 显示用户名称
  ];

  // 分页配置
  const paginationConfig = {
    pageSize: 5, // 每页显示 5 条数据
    showSizeChanger: false, // 隐藏每页条数选择器
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 添加数据按钮 */}
      <div style={{ textAlign: 'right', marginBottom: '20px' }}>
        <Button
          type="primary"
          onClick={() => setIsModalVisible(true)}
          style={{ fontSize: '16px', padding: '8px 16px' }} // 调整按钮大小
        >
          添加数据
        </Button>
      </div>

      {/* 弹窗表单 */}
      <Modal
        title="添加花销"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null} // 隐藏默认的底部按钮
        width="90%" // 在小屏幕上弹窗宽度占满屏幕
        style={{ maxWidth: '400px' }} // 在大屏幕上限制最大宽度
      >
        <Form onFinish={addExpense} layout="vertical">
          <Form.Item
            label="日期"
            name="date"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="请选择日期"
              format="YYYY-MM-DD"
              suffixIcon={<CalendarOutlined />}
              allowClear={false}
              className="custom-datepicker"
            />
          </Form.Item>
          <Form.Item
            label="消费品类"
            name="category"
            rules={[{ required: true, message: '请选择消费品类' }]}
          >
            <Select placeholder="请选择消费品类">
              {categories.map((category) => (
                <Option key={category} value={category}>
                  {category}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="支付方式"
            name="paymentMethod"
            rules={[{ required: true, message: '请选择支付方式' }]}
          >
            <Select placeholder="请选择支付方式">
              {paymentMethods.map((method) => (
                <Option key={method} value={method}>
                  {method}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="支付金额"
            name="amount"
            rules={[{ required: true, message: '请输入支付金额' }]}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item
            label="用户"
            name="user"
            rules={[{ required: true, message: '请选择用户' }]}
          >
            <Select placeholder="请选择用户">
              <Option value="畅">畅</Option>
              <Option value="杰">杰</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
              添加
            </Button>
            <Button
              style={{ width: '100%', marginTop: '10px' }}
              onClick={() => setIsModalVisible(false)}
            >
              取消
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 汇总部分 */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <Select
            defaultValue="category"
            style={{ width: 150 }}
            onChange={(value) => setSummaryType(value)}
          >
            <Option value="category">按消费品类汇总</Option>
            <Option value="paymentMethod">按支付方式汇总</Option>
          </Select>
        </div>
        <Table
          dataSource={getSummaryData()}
          columns={summaryColumns}
          pagination={false}
          rowKey="key"
          scroll={{ x: true }} // 启用水平滚动
        />
      </div>

      {/* 中部：畅和杰的花销明细 */}
      <Row gutter={16} style={{ marginTop: '20px' }}>
        <Col xs={24} sm={12}> {/* 在小屏幕上单列显示，中等屏幕以上双列显示 */}
          <Table
            dataSource={changExpenses}
            columns={detailColumns}
            pagination={paginationConfig} // 启用分页
            rowKey={(record) => record.date + record.amount}
            scroll={{ x: true, y: 240 }} // 启用水平和垂直滚动
          />
        </Col>
        <Col xs={24} sm={12}> {/* 在小屏幕上单列显示，中等屏幕以上双列显示 */}
          <Table
            dataSource={jieExpenses}
            columns={detailColumns}
            pagination={paginationConfig} // 启用分页
            rowKey={(record) => record.date + record.amount}
            scroll={{ x: true, y: 240 }} // 启用水平和垂直滚动
          />
        </Col>
      </Row>
    </div>
  );
}