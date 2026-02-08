import AuthMiddlewareNodeEditor from "@/components/Ui/AuthMiddlewareNodeEditor";
import DBDeleteNodeEditor from "@/components/Ui/DBDeleteNodeEditor";
import DBFindNodeEditor from "@/components/Ui/DBFindNodeEditor";
import DBInsertNodeEditor from "@/components/Ui/DBInsertNodeEditor";
import DBUpdateNodeEditor from "@/components/Ui/DBUpdateNodeEditor";
import InputNodeEditor from "@/components/Ui/InputNodeEditor";
import LoginNodeEditor from "@/components/Ui/LoginNodeEditor";

export const editorMap: any = {
  input: InputNodeEditor,
  dbFind: DBFindNodeEditor,
  dbInsert: DBInsertNodeEditor,
  dbUpdate: DBUpdateNodeEditor,
  userLogin: LoginNodeEditor,
  dbDelete: DBDeleteNodeEditor,
  authMiddleware: AuthMiddlewareNodeEditor,
};
