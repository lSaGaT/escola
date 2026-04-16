import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, MapPin, Package, ChevronLeft, ChevronRight, Plus, Trash2, Edit } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface AgendaEvent {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  hora?: string;
  local?: string;
  tipo: 'geral' | 'turma';
  sala?: string;
  itens_para_levar?: string[];
  criado_em: string;
}

const CLASSES = ['Maternal 1', 'Maternal 2', 'Maternal 3', '1º Período', '2º Período', 'Geral'];

export function AgendaPage({ role }: { role: 'teacher' | 'parent' }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [selectedDayEvents, setSelectedDayEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<AgendaEvent | null>(null);
  const [newItem, setNewItem] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    data: selectedDate.toISOString().split('T')[0],
    hora: '',
    local: '',
    tipo: 'geral' as 'geral' | 'turma',
    sala: '',
    itens_para_levar: [] as string[]
  });

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  useEffect(() => {
    filterEventsForSelectedDay();
  }, [selectedDate, events]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('agenda')
        .select('*')
        .gte('data', startOfMonth.toISOString().split('T')[0])
        .lte('data', endOfMonth.toISOString().split('T')[0])
        .eq('ativo', true)
        .order('data', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterEventsForSelectedDay = () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const dayEvents = events.filter(event => event.data === dateStr);
    setSelectedDayEvents(dayEvents);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const hasEventOnDay = (day: Date | null) => {
    if (!day) return false;
    const dateStr = day.toISOString().split('T')[0];
    return events.some(event => event.data === dateStr);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  const handleCreateEvent = () => {
    setEditEvent(null);
    setFormData({
      titulo: '',
      descricao: '',
      data: selectedDate.toISOString().split('T')[0],
      hora: '',
      local: '',
      tipo: 'geral',
      sala: '',
      itens_para_levar: []
    });
    setDialogOpen(true);
  };

  const handleEditEvent = (event: AgendaEvent) => {
    setEditEvent(event);
    setFormData({
      titulo: event.titulo,
      descricao: event.descricao || '',
      data: event.data,
      hora: event.hora || '',
      local: event.local || '',
      tipo: event.tipo,
      sala: event.sala || '',
      itens_para_levar: event.itens_para_levar || []
    });
    setDialogOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return;

    try {
      const { error } = await supabase
        .from('agenda')
        .update({ ativo: false })
        .eq('id', eventId);

      if (error) throw error;
      fetchEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Erro ao excluir evento');
    }
  };

  const handleSaveEvent = async () => {
    try {
      const eventData = {
        ...formData,
        itens_para_levar: formData.itens_para_levar.length > 0 ? formData.itens_para_levar : null
      };

      if (editEvent) {
        const { error } = await supabase
          .from('agenda')
          .update(eventData)
          .eq('id', editEvent.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('agenda')
          .insert(eventData);

        if (error) throw error;
      }

      setDialogOpen(false);
      fetchEvents();
    } catch (err) {
      console.error('Error saving event:', err);
      alert('Erro ao salvar evento');
    }
  };

  const addItem = () => {
    if (newItem.trim()) {
      setFormData({
        ...formData,
        itens_para_levar: [...formData.itens_para_levar, newItem.trim()]
      });
      setNewItem('');
    }
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      itens_para_levar: formData.itens_para_levar.filter((_, i) => i !== index)
    });
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const days = getDaysInMonth(currentDate);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Calendário - Esquerda */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={previousMonth}
                className="rounded-full"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextMonth}
                className="rounded-full"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Dias da semana */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-sm font-medium text-slate-500">
                {day}
              </div>
            ))}
          </div>

          {/* Dias do mês */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => (
              <button
                key={index}
                onClick={() => day && handleDayClick(day)}
                disabled={!day}
                className={`
                  aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all
                  ${!day ? 'pointer-events-none' : ''}
                  ${selectedDate.toDateString() === day?.toDateString()
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg scale-105'
                    : hasEventOnDay(day!)
                      ? 'bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer border-2 border-red-200'
                      : 'hover:bg-slate-100 cursor-pointer text-slate-700'
                  }
                `}
              >
                {day?.getDate()}
                {hasEventOnDay(day!) && selectedDate.toDateString() !== day?.toDateString() && (
                  <div className="absolute bottom-1 w-1 h-1 bg-red-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Eventos do dia - Direita */}
      <Card className="shadow-sm">
        <CardContent className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                {selectedDate.getDate()} de {months[selectedDate.getMonth()]}
              </h2>
              <p className="text-slate-500 text-sm">
                {selectedDayEvents.length} evento{selectedDayEvents.length !== 1 ? 's' : ''} programado{selectedDayEvents.length !== 1 ? 's' : ''}
              </p>
            </div>
            {role === 'teacher' && (
              <Button
                onClick={handleCreateEvent}
                className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-full gap-2"
              >
                <Plus className="h-4 w-4" />
                Novo Evento
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <div className="animate-pulse">Carregando eventos...</div>
              </div>
            ) : selectedDayEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Calendar className="h-16 w-16 mb-4 text-slate-200" />
                <p className="font-medium">Nenhum evento neste dia</p>
                {role === 'teacher' && (
                  <Button
                    onClick={handleCreateEvent}
                    variant="outline"
                    className="mt-4 rounded-full"
                  >
                    Criar Evento
                  </Button>
                )}
              </div>
            ) : (
              <AnimatePresence>
                {selectedDayEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-slate-800">{event.titulo}</h3>
                          <Badge
                            variant={event.tipo === 'geral' ? 'default' : 'secondary'}
                            className={event.tipo === 'geral' ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' : 'bg-blue-100 text-blue-700'}
                          >
                            {event.tipo === 'geral' ? 'Geral' : event.sala}
                          </Badge>
                        </div>
                        {event.descricao && (
                          <p className="text-slate-600 text-sm">{event.descricao}</p>
                        )}
                      </div>
                      {role === 'teacher' && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditEvent(event)}
                            className="text-slate-400 hover:text-blue-500"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteEvent(event.id)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 text-sm text-slate-600">
                      {event.hora && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-red-500" />
                          <span>{event.hora}</span>
                        </div>
                      )}
                      {event.local && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-red-500" />
                          <span>{event.local}</span>
                        </div>
                      )}
                      {event.itens_para_levar && event.itens_para_levar.length > 0 && (
                        <div className="mt-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                          <div className="flex items-center gap-2 text-orange-700 font-medium mb-2">
                            <Package className="h-4 w-4" />
                            <span>Itens para levar:</span>
                          </div>
                          <ul className="space-y-1">
                            {event.itens_para_levar.map((item, index) => (
                              <li key={index} className="flex items-center gap-2 text-sm text-orange-600">
                                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de criação/edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editEvent ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ex: Piquenique no parque"
                className="rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Detalhes do evento..."
                rows={3}
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="hora">Horário</Label>
                <Input
                  id="hora"
                  type="time"
                  value={formData.hora}
                  onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="local">Local</Label>
              <Input
                id="local"
                value={formData.local}
                onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                placeholder="Ex: Parque da Cidade"
                className="rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="tipo">Tipo de Evento *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value: 'geral' | 'turma') => setFormData({ ...formData, tipo: value })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">Geral (toda a escola)</SelectItem>
                  <SelectItem value="turma">Por turma</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.tipo === 'turma' && (
              <div>
                <Label htmlFor="sala">Turma *</Label>
                <Select
                  value={formData.sala}
                  onValueChange={(value) => setFormData({ ...formData, sala: value })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione a turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASSES.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Itens para levar (opcional)</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addItem()}
                  placeholder="Ex: Garrafa de água"
                  className="rounded-xl"
                />
                <Button
                  onClick={addItem}
                  type="button"
                  variant="outline"
                  className="rounded-xl px-4"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.itens_para_levar.length > 0 && (
                <div className="space-y-2">
                  {formData.itens_para_levar.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                      <Checkbox
                        checked={false}
                        disabled
                        className="pointer-events-none"
                      />
                      <span className="flex-1 text-sm">{item}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="h-6 w-6 text-slate-400 hover:text-red-500"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEvent}
              disabled={!formData.titulo || !formData.data || (formData.tipo === 'turma' && !formData.sala)}
              className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl"
            >
              {editEvent ? 'Atualizar' : 'Criar'} Evento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
