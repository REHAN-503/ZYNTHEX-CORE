

#include <napi.h>
#include <string>
#include <unordered_map>
#include <vector>
#include <sstream>
#include <ctime>
#include <random>


struct UserData {
  std::string name;
  int xp = 0;
  int level = 1;
  int questionsAnswered = 0;
  int correctAnswers = 0;
};

static std::unordered_map<std::string, UserData> g_users;
static std::mt19937 g_rng(std::random_device{}());


static const std::vector<int> LEVEL_THRESHOLDS = {
  0, 200, 500, 1000, 1800, 3000, 5000, 8000, 12000, 18000, 25000
};

static int computeLevel(int xp) {
  int level = 1;
  for (size_t i = 0; i < LEVEL_THRESHOLDS.size(); ++i) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = static_cast<int>(i) + 1;
    else break;
  }
  return std::min(level, static_cast<int>(LEVEL_THRESHOLDS.size()));
}

Napi::Value InitializeUser(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "String 'name' expected").ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string name = info[0].As<Napi::String>().Utf8Value();
  std::string userId = name;

  std::transform(userId.begin(), userId.end(), userId.begin(), ::tolower);
  std::replace(userId.begin(), userId.end(), ' ', '_');

  if (g_users.find(userId) == g_users.end()) {
    UserData ud;
    ud.name = name;
    g_users[userId] = ud;
  }

  const UserData& ud = g_users[userId];
  Napi::Object result = Napi::Object::New(env);
  result.Set("userId", Napi::String::New(env, userId));
  result.Set("name", Napi::String::New(env, ud.name));
  result.Set("xp", Napi::Number::New(env, ud.xp));
  result.Set("level", Napi::Number::New(env, computeLevel(ud.xp)));
  return result;
}

Napi::Value GetUserXP(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "String 'userId' expected").ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string userId = info[0].As<Napi::String>().Utf8Value();
  Napi::Object result = Napi::Object::New(env);

  if (g_users.find(userId) != g_users.end()) {
    const UserData& ud = g_users[userId];
    result.Set("xp", Napi::Number::New(env, ud.xp));
    result.Set("level", Napi::Number::New(env, computeLevel(ud.xp)));
  } else {
    result.Set("xp", Napi::Number::New(env, 0));
    result.Set("level", Napi::Number::New(env, 1));
  }
  return result;
}


Napi::Value GetUserLevel(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 1 || !info[0].IsString()) return Napi::Number::New(env, 1);
  std::string userId = info[0].As<Napi::String>().Utf8Value();
  if (g_users.find(userId) == g_users.end()) return Napi::Number::New(env, 1);
  return Napi::Number::New(env, computeLevel(g_users[userId].xp));
}


Napi::Value SubmitAnswer(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 5) {
    Napi::TypeError::New(env, "Expected: userId, questionId, answer, correct, xpReward").ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string userId = info[0].As<Napi::String>().Utf8Value();
  bool correct = info[3].As<Napi::Boolean>().Value();
  int xpReward = info[4].As<Napi::Number>().Int32Value();

  if (g_users.find(userId) == g_users.end()) {
    Napi::Error::New(env, "User not found").ThrowAsJavaScriptException();
    return env.Null();
  }

  UserData& ud = g_users[userId];
  ud.questionsAnswered++;
  if (correct) {
    ud.correctAnswers++;
    ud.xp += xpReward;
  }
  ud.level = computeLevel(ud.xp);

  Napi::Object result = Napi::Object::New(env);
  result.Set("newXP", Napi::Number::New(env, ud.xp));
  result.Set("level", Napi::Number::New(env, ud.level));
  result.Set("correct", Napi::Boolean::New(env, correct));
  return result;
}


Napi::Value GetUserAnalytics(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 1 || !info[0].IsString()) return env.Null();

  std::string userId = info[0].As<Napi::String>().Utf8Value();
  Napi::Object result = Napi::Object::New(env);

  if (g_users.find(userId) == g_users.end()) {
    result.Set("xp", Napi::Number::New(env, 0));
    result.Set("level", Napi::Number::New(env, 1));
    result.Set("total", Napi::Number::New(env, 0));
    result.Set("correct", Napi::Number::New(env, 0));
    result.Set("accuracy", Napi::Number::New(env, 0.0));
    return result;
  }

  const UserData& ud = g_users[userId];
  double accuracy = ud.questionsAnswered > 0
    ? static_cast<double>(ud.correctAnswers) / ud.questionsAnswered * 100.0
    : 0.0;

  result.Set("xp", Napi::Number::New(env, ud.xp));
  result.Set("level", Napi::Number::New(env, computeLevel(ud.xp)));
  result.Set("total", Napi::Number::New(env, ud.questionsAnswered));
  result.Set("correct", Napi::Number::New(env, ud.correctAnswers));
  result.Set("accuracy", Napi::Number::New(env, accuracy));
  return result;
}


Napi::Value GenerateCertificate(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 2) return env.Null();

  std::string userId = info[0].As<Napi::String>().Utf8Value();
  std::string language = info[1].As<Napi::String>().Utf8Value();

  std::ostringstream certId;
  certId << "ZYNC-" << std::time(nullptr) << "-" << (g_rng() % 999999);

  const UserData& ud = g_users.count(userId) ? g_users[userId] : UserData{};
  double accuracy = ud.questionsAnswered > 0
    ? static_cast<double>(ud.correctAnswers) / ud.questionsAnswered * 100.0
    : 0.0;

  Napi::Object result = Napi::Object::New(env);
  result.Set("certId", Napi::String::New(env, certId.str()));
  result.Set("name", Napi::String::New(env, ud.name));
  result.Set("language", Napi::String::New(env, language));
  result.Set("accuracy", Napi::Number::New(env, accuracy));
  result.Set("level", Napi::Number::New(env, computeLevel(ud.xp)));
  return result;
}

Napi::Value LoadUser(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 5) {
    Napi::TypeError::New(env, "Expected: userId, name, xp, questionsAnswered, correctAnswers").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  std::string userId = info[0].As<Napi::String>().Utf8Value();
  std::string name   = info[1].As<Napi::String>().Utf8Value();
  int xp             = info[2].As<Napi::Number>().Int32Value();
  int total          = info[3].As<Napi::Number>().Int32Value();
  int correct        = info[4].As<Napi::Number>().Int32Value();

  UserData ud;
  ud.name              = name;
  ud.xp                = xp;
  ud.level             = computeLevel(xp);
  ud.questionsAnswered = total;
  ud.correctAnswers    = correct;
  g_users[userId]      = ud;

  return env.Undefined();
}


Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("initializeUser",   Napi::Function::New(env, InitializeUser));
  exports.Set("loadUser",         Napi::Function::New(env, LoadUser));
  exports.Set("getUserXP",        Napi::Function::New(env, GetUserXP));
  exports.Set("getUserLevel",     Napi::Function::New(env, GetUserLevel));
  exports.Set("submitAnswer",     Napi::Function::New(env, SubmitAnswer));
  exports.Set("getUserAnalytics", Napi::Function::New(env, GetUserAnalytics));
  return exports;
}

NODE_API_MODULE(zynthex_engine, Init)
