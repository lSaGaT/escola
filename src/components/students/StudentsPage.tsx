import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Baby, Search, Filter, Mail, Phone, Calendar, Edit } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { Aluno } from '@/src/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentForm } from '@/src/components/admin/StudentForm';

const CLASSES = ['Maternal 1', 'Maternal 2', 'Maternal 3', 'Maternal 4', '1ª Série'];

export function StudentsPage({ role, assignedClass }: { role: 'teacher' | 'parent'; assignedClass?: string }) {
  const [students, setStudents] = useState<Aluno[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Aluno[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>(assignedClass || CLASSES[0]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Aluno | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (role === 'parent' && assignedClass) {
      setSelectedClass(assignedClass);
    }
  }, [role, assignedClass]);

  useEffect(() => {
    fetchStudents();
  }, [selectedClass, refreshTrigger]);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('sala', selectedClass)
        .eq('ativo', true)
        .order('nome_aluno', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    if (!searchTerm) {
      setFilteredStudents(students);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = students.filter(student =>
      student.nome_aluno.toLowerCase().includes(term) ||
      student.nome_pai?.toLowerCase().includes(term) ||
      student.nome_mae?.toLowerCase().includes(term) ||
      student.telefone_contato?.includes(term)
    );
    setFilteredStudents(filtered);
  };

  const handleEditStudent = (student: Aluno) => {
    setEditStudent(student);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const calculateAge = (dateString?: string) => {
    if (!dateString) return '-';
    const birthDate = new Date(dateString);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="h-6 w-6 text-red-500" />
            Turmas e Alunos
          </h2>
          <p className="text-slate-500 text-sm">
            {role === 'teacher'
              ? 'Gerencie os alunos e visualize as turmas'
              : 'Visualize os alunos da turma do seu filho'
            }
          </p>
        </div>

        {role === 'teacher' && (
          <Button
            onClick={() => {
              setEditStudent(null);
              setFormOpen(true);
            }}
            className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl gap-2"
          >
            <Users className="h-4 w-4" />
            Novo Aluno
          </Button>
        )}
      </div>

      {/* Class Selection */}
      {role === 'teacher' && (
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <Tabs value={selectedClass} onValueChange={setSelectedClass}>
            <TabsList className="bg-red-50 border border-red-100 p-1 h-auto flex-wrap justify-start gap-2 rounded-xl">
              {CLASSES.map((cls) => (
                <TabsTrigger
                  key={cls}
                  value={cls}
                  className="rounded-lg px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white transition-all font-medium text-sm"
                >
                  <Baby className="h-4 w-4 mr-2" />
                  {cls}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome, responsáveis ou telefone..."
          className="pl-12 rounded-xl border-slate-200 focus:border-red-400 focus:ring-red-50"
        />
      </div>

      {/* Students List */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <div className="animate-pulse">Carregando alunos...</div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Users className="h-16 w-16 mb-4 text-slate-200" />
              <p className="font-medium">
                {searchTerm ? 'Nenhum aluno encontrado' : 'Nenhum aluno nesta turma'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">
                  {selectedClass} - {filteredStudents.length} aluno{filteredStudents.length !== 1 ? 's' : ''}
                </h3>
              </div>

              <AnimatePresence>
                {filteredStudents.map((student, index) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white border border-slate-100 rounded-xl p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {student.nome_aluno.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-lg text-slate-800">{student.nome_aluno}</h4>
                            <Badge variant="secondary" className="bg-red-50 text-red-600">
                              {selectedClass}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Users className="h-4 w-4 text-red-400" />
                              <span className="font-medium">Pai:</span>
                              <span>{student.nome_pai || 'Não informado'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                              <Users className="h-4 w-4 text-red-400" />
                              <span className="font-medium">Mãe:</span>
                              <span>{student.nome_mae || 'Não informado'}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {student.telefone_contato && (
                              <div className="flex items-center gap-2 text-slate-600">
                                <Phone className="h-4 w-4 text-red-400" />
                                <a
                                  href={`https://wa.me/55${student.telefone_contato.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-green-600 hover:underline transition-colors"
                                >
                                  {student.telefone_contato}
                                </a>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-slate-600">
                              <Calendar className="h-4 w-4 text-red-400" />
                              <span>
                                {calculateAge(student.data_nascimento)} anos • {formatDate(student.data_nascimento)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {student.observacoes && (
                          <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                            <p className="text-sm text-orange-700">
                              <span className="font-medium">Observações:</span> {student.observacoes}
                            </p>
                          </div>
                        )}
                      </div>

                      {role === 'teacher' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditStudent(student)}
                          className="text-slate-400 hover:text-blue-500"
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Form Dialog */}
      <StudentForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
        editStudent={editStudent}
      />
    </div>
  );
}
