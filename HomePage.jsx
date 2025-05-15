import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Button,
  Typography,
  notification,
  Card,
  Table,
  Progress,
} from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import axios from "axios";

const { Title } = Typography;
const { Option } = Select;

const foodDatabase = [
  { food: "Yulaf ezmesi", calories: 150 },
  { food: "Haşlanmış yumurta", calories: 78 },
  { food: "Tam buğday ekmeği", calories: 70 },
  { food: "Izgara tavuk göğsü", calories: 165 },
  { food: "Salata (zeytinyağsız)", calories: 50 },
  { food: "Esmer pirinç", calories: 215 },
  { food: "Yoğurt", calories: 100 },
  { food: "Meyve", calories: 90 },
  { food: "Badem (5 adet)", calories: 35 },
  { food: "Izgara balık", calories: 200 },
  { food: "Sebze yemeği", calories: 120 },
  { food: "Çorba", calories: 80 },
];

const mealNames = {
  breakfast: "Kahvaltı",
  lunch: "Öğle Yemeği",
  dinner: "Akşam Yemeği",
  snacks: "Ara Öğün",
};

const SHEET_API_URL =
  "https://v1.nocodeapi.com/emir_kaya/google_sheets/swgDvTtHDXrTfXm";

const HomePage = () => {
  const [calories, setCalories] = useState(null);
  const [dietPlan, setDietPlan] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [selectedFoodToRemove, setSelectedFoodToRemove] = useState(null);
  const navigate = useNavigate();

  const mealDistribution = {
    breakfast: 0.25,
    lunch: 0.3,
    dinner: 0.25,
    snacks: 0.2,
  };

  const generateDietPlan = (dailyCalories) => {
    const meals = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: [],
    };

    const getMealItems = (maxCalories) => {
      const items = [];
      let total = 0;
      const shuffled = [...foodDatabase].sort(() => 0.5 - Math.random());
      for (let item of shuffled) {
        if (total + item.calories <= maxCalories) {
          items.push(item);
          total += item.calories;
        }
        if (total >= maxCalories - 30) break;
      }
      return items;
    };

    for (let meal in meals) {
      const maxCals = dailyCalories * mealDistribution[meal];
      meals[meal] = getMealItems(maxCals);
    }

    return meals;
  };

  const totalDietCalories = dietPlan
    ? Object.values(dietPlan).flat().reduce((sum, item) => sum + item.calories, 0)
    : 0;

  const percentCalories = calories
    ? Math.round((totalDietCalories / calories) * 100)
    : 0;

  const onFinish = (values) => {
    const { fullName, email, weight, height, age, gender, activity } = values;

    let bmr;
    if (gender === "male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    const activityMultipliers = {
      low: 1.2,
      moderate: 1.55,
      high: 1.9,
    };

    const dailyCalories = Math.round(bmr * activityMultipliers[activity]);
    setCalories(dailyCalories);

    const plan = generateDietPlan(dailyCalories);
    setDietPlan(plan);

    // Google Sheets kaydı
    const rows = [];
    rows.push([
      new Date().toLocaleString(),
      fullName,
      email,
      dailyCalories,
      "Standart Diyet",
    ]);

    axios
      .post(
        SHEET_API_URL,
        {
          tabId: "DiyetPlanlari",
          values: rows,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .catch(() => {});

    // Mail gönderimi
    axios
      .post("http://localhost:5000/send-email", {
        email: email,
        dietPlan: plan,
        dailyCalories: dailyCalories,
      })
      .then(() => {
        notification.success({
          message: "Mail Gönderildi",
          description: "Diyet planınız e-posta adresinize gönderildi!",
          placement: "topRight",
        });
      })
      .catch(() => {
        notification.error({
          message: "Hata",
          description: "Mail gönderilemedi, lütfen tekrar deneyin.",
          placement: "topRight",
        });
      });
  };

  const handleRemoveFood = () => {
    if (!selectedMeal || !selectedFoodToRemove) {
      notification.warning({
        message: "Uyarı",
        description: "Lütfen çıkarılacak öğünü ve yiyeceği seçin.",
        placement: "topRight",
      });
      return;
    }

    const currentMealItems = dietPlan[selectedMeal];
    const foodToRemove = currentMealItems.find(
      (item) => item.food === selectedFoodToRemove
    );
    if (!foodToRemove) return;

    const newMealItems = currentMealItems.filter(
      (item) => item.food !== selectedFoodToRemove
    );

    const caloriesFreed = foodToRemove.calories;

    const currentTotalCalories = newMealItems.reduce(
      (sum, item) => sum + item.calories,
      0
    );

    const maxMealCalories = calories * mealDistribution[selectedMeal];

    // Yeni eklenebilecek besinler
    const possibleAdditions = foodDatabase.filter(
      (food) =>
        !newMealItems.some((item) => item.food === food.food) &&
        food.calories <= caloriesFreed &&
        food.calories + currentTotalCalories <= maxMealCalories
    );

    if (possibleAdditions.length === 0) {
      // Sadece çıkar
      setDietPlan({
        ...dietPlan,
        [selectedMeal]: newMealItems,
      });
      notification.info({
        message: "Besin çıkarıldı",
        description: `${selectedFoodToRemove} çıkarıldı, yeni besin eklenmedi.`,
        placement: "topRight",
      });
      setSelectedFoodToRemove(null);
      return;
    }

    const foodToAdd = possibleAdditions[0];
    const updatedMealItems = [...newMealItems, foodToAdd];

    setDietPlan({
      ...dietPlan,
      [selectedMeal]: updatedMealItems,
    });

    notification.success({
      message: "Besin değiştirildi",
      description: `${selectedFoodToRemove} çıkarıldı, yerine ${foodToAdd.food} eklendi.`,
      placement: "topRight",
    });

    setSelectedFoodToRemove(null);
  };

  const columns = [
    { title: "Öğün", dataIndex: "meal", key: "meal" },
    { title: "Yiyecek", dataIndex: "food", key: "food" },
    { title: "Kalori", dataIndex: "calories", key: "calories" },
  ];

  const generateTableData = (plan) => {
    const data = [];
    Object.keys(plan).forEach((meal, idx) => {
      plan[meal].forEach((item) => {
        data.push({
          key: item.food + idx,
          meal: mealNames[meal],
          food: item.food,
          calories: item.calories,
        });
      });
    });
    return data;
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundImage: "url('/bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: -1,
        }}
      />

      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          padding: 24,
          boxSizing: "border-box",
          color: "#000",
          display: "flex",
          gap: 24,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <Card
          title={<Title level={3}>Günlük Kalori Hesaplayıcı</Title>}
          style={{
            borderRadius: 10,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            width: 450,
            maxHeight: "90vh",
            overflowY: "auto",
            backgroundColor: "rgba(255, 255, 255, 0.85)",
          }}
        >
          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              label="Ad - Soyad"
              name="fullName"
              rules={[{ required: true, message: "Lütfen adınızı soyadınızı giriniz!" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="E-posta"
              name="email"
              rules={[
                { required: true, message: "Lütfen e-posta giriniz!" },
                { type: "email", message: "Geçerli bir e-posta adresi giriniz!" },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Boy (cm)"
              name="height"
              rules={[
                { required: true, message: "Lütfen boyunuzu giriniz!" },
                { type: "number", min: 100, max: 250, message: "Geçerli bir boy girin!" },
              ]}
            >
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              label="Kilo (kg)"
              name="weight"
              rules={[
                { required: true, message: "Lütfen kilonuzu giriniz!" },
                { type: "number", min: 30, max: 300, message: "Geçerli bir kilo girin!" },
              ]}
            >
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              label="Yaş"
              name="age"
              rules={[
                { required: true, message: "Lütfen yaşınızı giriniz!" },
                { type: "number", min: 10, max: 100, message: "Geçerli bir yaş girin!" },
              ]}
            >
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              label="Cinsiyet"
              name="gender"
              rules={[{ required: true, message: "Lütfen cinsiyet seçiniz!" }]}
            >
              <Radio.Group>
                <Radio value="male">Erkek</Radio>
                <Radio value="female">Kadın</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item
              label="Aktivite Seviyesi"
              name="activity"
              rules={[{ required: true, message: "Lütfen aktivite seviyenizi seçiniz!" }]}
            >
              <Select placeholder="Seçiniz">
                <Option value="low">Düşük</Option>
                <Option value="moderate">Orta</Option>
                <Option value="high">Yüksek</Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Diyet Planı Oluştur
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {dietPlan && (
          <>
            <Card
              title={<Title level={4}>Diyet Planı</Title>}
              style={{
                borderRadius: 10,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                width: 500,
                maxHeight: "90vh",
                overflowY: "auto",
                backgroundColor: "rgba(255, 255, 255, 0.85)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <Table
                dataSource={generateTableData(dietPlan)}
                columns={columns}
                pagination={false}
                size="small"
              />

              <div style={{ marginTop: 16 }}>
                <Select
                  placeholder="Öğün Seçiniz"
                  value={selectedMeal}
                  onChange={setSelectedMeal}
                  style={{ width: "48%", marginRight: "4%" }}
                >
                  {Object.keys(dietPlan).map((meal) => (
                    <Option key={meal} value={meal}>
                      {mealNames[meal]}
                    </Option>
                  ))}
                </Select>

                <Select
                  placeholder="Çıkarılacak Besin"
                  value={selectedFoodToRemove}
                  onChange={setSelectedFoodToRemove}
                  style={{ width: "48%" }}
                  disabled={!selectedMeal}
                >
                  {selectedMeal &&
                    dietPlan[selectedMeal].map((item) => (
                      <Option key={item.food} value={item.food}>
                        {item.food} ({item.calories} kcal)
                      </Option>
                    ))}
                </Select>

                <Button
                  type="primary"
                  onClick={handleRemoveFood}
                  style={{ marginTop: 12 }}
                  block
                >
                  Besini Çıkar / Değiştir
                </Button>
              </div>
            </Card>

            <Card
              title={<Title level={4}>Günlük Kalori Kullanımı</Title>}
              style={{
                borderRadius: 10,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                width: 300,
                height: 350,
                backgroundColor: "rgba(255, 255, 255, 0.85)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
              }}
            >
              <Progress
                type="circle"
                percent={percentCalories}
                format={(percent) => `${percent}%`}
                strokeColor={{
                  "0%": "#108ee9",
                  "100%": "#87d068",
                }}
                width={200}
              />
              <div style={{ marginTop: 20, fontSize: 16, textAlign: "center" }}>
                Günlük Kalori İhtiyacı: <b>{calories} kcal</b>
                <br />
                Toplam Diyet Kalorisi: <b>{totalDietCalories} kcal</b>
              </div>
        </Card>
      </>
    )}
  </div>

  <Button
    type="primary"
    danger
    icon={<LogoutOutlined />}
    style={{ position: "fixed", top: 16, right: 16 }}
    onClick={() => navigate("/")}
  >
    Çıkış
  </Button>
</>
);
};

export default HomePage;