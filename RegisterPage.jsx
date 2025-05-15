import React, { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';

const { Title } = Typography;

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = (values) => {
    setLoading(true);
    const users = JSON.parse(localStorage.getItem('users')) || [];

    const userExists = users.some(user => user.email === values.email);
    if (userExists) {
      message.error('Bu e-posta zaten kayıtlı!');
      setLoading(false);
      return;
    }

    const newUser = {
      fullname: values.fullname,
      email: values.email,
      password: values.password,
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    message.success('Kayıt başarılı! Giriş yapabilirsiniz.');

    setTimeout(() => {
      setLoading(false);
      navigate('/login');
    }, 1000);
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundImage: 'url("/bg.jpg")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      position: 'relative',
    }}>
      {/* Karartma overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1,
      }} />

      {/* Form kutusu */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        width: '100%',
        maxWidth: '400px',
        zIndex: 2,
      }}>
        <Title level={2} style={{ textAlign: 'center' }}>
          Kayıt Ol
        </Title>

        <Form name="register_form" layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Ad Soyad"
            name="fullname"
            rules={[{ required: true, message: 'Lütfen adınızı giriniz!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Adınız Soyadınız" />
          </Form.Item>

          <Form.Item
            label="E-posta"
            name="email"
            rules={[
              { required: true, message: 'Lütfen e-posta giriniz!' },
              { type: 'email', message: 'Geçerli bir e-posta giriniz!' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="ornek@diyetisyen.com" />
          </Form.Item>

          <Form.Item
            label="Şifre"
            name="password"
            rules={[
              { required: true, message: 'Lütfen şifre giriniz!' },
              { min: 6, message: 'Şifre en az 6 karakter olmalı!' },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
                message: 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermeli!'
              }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Şifreniz" />
          </Form.Item>

          <Form.Item
            label="Şifre Tekrar"
            name="confirm"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Lütfen şifreyi tekrar giriniz!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Şifreler uyuşmuyor!'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Şifreyi tekrar giriniz" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Kayıt Ol
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'right', marginTop: '-12px' }}>
          <Link to="/login">Giriş Yap</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
